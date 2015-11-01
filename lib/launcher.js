var exec = require('child_process').exec
var http = require('http')
var Promise = require('promise')
var path = require('path')
var express = require('express')
var expressValidator = require('express-validator')
var validate = require('./validation')
var log = require('npmlog')
var marked = require('marked')
var hash = require('vjs/lib/util/hash.js')
var fs = require('vigour-fs/lib/server')
var stat = Promise.denodeify(fs.stat)
var remove = Promise.denodeify(fs.remove)
var readdir = Promise.denodeify(fs.readdir)
var mkdirp = Promise.denodeify(fs.mkdirp)
var separatorPrefix = 'next:'
var separatorPrefixBuf = new Buffer(separatorPrefix)
var separatorErrorSuffix = ':error'
var separatorErrorSuffixBuf = new Buffer(separatorErrorSuffix)
var qs = require('query-string')
var clone = require('lodash/lang/clone')

// var spriteMaker = require('./spriteMaker')
var imgManip = require('./imgManip')
var util = require('./util')
var setHeaders = require('./setHeaders')

var unlink = Promise.denodeify(fs.unlink)
var options

var httpAgent = new http.Agent({ maxSockets: 8 })

// TODO Find another solution for this (modifying Error.prototype is dirty)
Object.defineProperty(Error.prototype, 'toJSON', {
  value: function () {
    var alt = {}

    Object.getOwnPropertyNames(this).forEach(function (key) {
      alt[key] = this[key]
    }, this)

    return alt
  },
  configurable: true
})

module.exports = exports = function (_options) {
  options = _options
  // log.info('Options', JSON.stringify(options, null, 2))
  if (options.clean) {
    return clean(options)
  } else if (options.manip) {
    return manip(options)
  } else {
    return exports.serve(options)
  }
}

exports.serve = function (options) {
  var handle
  validate.init(options)
  imgManip.init(options)
  var app = express()

  if (options.verbose) {
    app.use(function (req, res, next) {
      log.info(req.method, req.originalUrl)
      next()
    })
  }

  // app.use(bodyParser.urlencoded({
  //   extended: true
  // }))

  app.use(expressValidator())

  // use README.md file as a homepage
  app.get('/', function (req, res) {
    res.set('content-type', 'text/html')
    res.send(
      '<style>' +
        fs.readFileSync('./node_modules/github-markdown-css/github-markdown.css') +
      '</style>' +
      '<div class="markdown-body">' +
        marked(
          fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8')
        ) +
      '</div>'
    )
    res.end()
  })

  app.get('/invalidate/*', function (req, res, next) {
    var paths = {}
    var stripped = req.originalUrl.slice(1)
    var target = stripped.slice(stripped.indexOf('/'))

    paths.out = path.join(options.outDir, encodeURIComponent(target))
    if (req.query.url) {
      paths.original = req.query.url.slice(req.query.url.lastIndexOf('/') + 1)
    } else {
      if (target.indexOf('/image/') === 0) {
        target = target.slice(7)
        target = target.slice(0, target.indexOf('/'))
      }
      paths.original = target
    }
    paths.original = path.join(options.originalsPath, paths.original)
    Promise.all(unlink(paths.out + '.jpg'), unlink(paths.out + '.png'), unlink(paths.original))
      .then(function (results) {
        // log.info('Erased', paths.out)
        // log.info('Erased', paths.original)
        res.end(JSON.stringify(paths, null, 2))
      })
      .catch(function (reason) {
        log.error('Failed to remove cache', reason)
        res.status(500).end('Failed')
      })
  })

  app.post('/image/:width/:height'
    , validate.dimensions()
    , validate.effects
    , makeOutPost
    , prepare()
    , morePrepPost(options)
    , imageTransform
    , serveTransformed
  )

  app.post('/image'
    , validate.dimensions(true)
    , validate.effects
    , makeOutPost
    , prepare(true)
    , morePrepPost(options)
    , imageTransform
    , serveTransformed
  )

  app.get('/image/:width/:height'
    , validate.dimensions()
    , validate.imgURL
    , validate.effects
    , cacheForever(true)
    , makeOut
    , serveCached
    , prepare()
    , morePrep(options)
    , imageDownload
    , imageTransform
    , serveTransformed
  )

  app.get('/image'
    , validate.dimensions(true)
    , validate.imgURL
    , validate.effects
    , cacheForever(true)
    , makeOut
    , serveCached
    , prepare(true)
    , morePrep(options)
    , imageDownload
    , imageTransform
    , serveTransformed
  )

  app.post('/batch',
    morePrepPost(options),
    function (req, res, next) {
      try {
        var items = JSON.parse(req.query.items)
      } catch (e) {
        var error = new Error('Invalid JSON')
        error.info = {
          msg: 'items should be a valid JSON array'
        }
        res.status(400).send(JSON.stringify(error, null, 2))
        res.end()
      }
      res.status(200)

      var prom = Promise.resolve()
      var transformed = items.map(function (item) {
        var disc = Math.random()
        return imgManip.effect(
          item,
          req.pathToOriginal,
          {
            width: item.width,
            height: item.height
          },
          path.join(options.outDir, 'POSTEDIMAGE' + disc)
        ).then(function (newPath) {
          prom = prom.then(function () {
            return new Promise(function (resolve, reject) {
              var rs = fs.createReadStream(newPath)
              res.write(separatorPrefix + item.dst)
              rs.on('error', reject)

              rs.on('data', function (chunk) {
                res.write(chunk)
              })

              rs.on('end', function () {
                var timeOut = setTimeout(function () {
                  onDrain()
                  res.removeListener('drain', onDrain)
                }, 100)

                function onDrain () {
                  clearTimeout(timeOut)
                  res.removeListener('drain', onDrain)
                  resolve(item)
                }

                res.once('drain', onDrain)
              })
            })
          })
          return prom
        }, function (reason) {
          prom = prom.then(function () {
            return new Promise(function (resolve, reject) {
              res.write(separatorPrefix + item.dst + separatorErrorSuffix)
              res.write(reason.toString())
              var timeOut = setTimeout(function () {
                onDrain()
                res.removeListener('drain', onDrain)
              }, 100)

              function onDrain () {
                clearTimeout(timeOut)
                res.removeListener('drain', onDrain)
                resolve(item)
              }
              res.once('drain', onDrain)
            })
          })
          return prom
        })
      })
      Promise.all(transformed)
        .then(function (arr) {
          res.end()
          util.cleanup(req.pathToOriginal)
        })
    }
  )

  // Deprecated
  app.get('/image/:id/:width/:height'
    , validate.dimensions()
    , validate.imgId
    , validate.effects
    , cacheForever(true)
    , makeOut
    , serveCached
    , prepare()
    , function (req, res, next) {
      var url = util.urlFromId(req.params.id)
      req.url = url
      req.pathToOriginal = path.join(options.originalsPath, hash(url))

      next()
    }
    , imageDownload
    , imageTransform
    , serveTransformed
  )

  // app.get('/sprite/:country/:lang/shows/:width/:height'
  //  , validateDimensions()
  //  , cacheForever(false)
  //  , makeOut
  //  , serveCached
  //  , prepare()
  //  , function (req, res, next) {
  //    var p = req.params
  //    req.pathToSpriteData = [p.country
  //      , p.lang
  //      , 'shows'
  //    ]
  //    next()
  //  }
  //  , requestSprite)

  // app.get('/sprite/:country/:lang/episodes/:showId/:seasonId/:width/:height'
  //  , validateDimensions()
  //  , cacheForever(false)
  //  , makeOut
  //  , serveCached
  //  , prepare()
  //  , function (req, res, next) {
  //    var p = req.params
  //    req.pathToSpriteData = [p.country
  //      , p.lang
  //      , 'shows'
  //      , p.showId
  //      , 'seasons'
  //      , p.seasonId
  //      , 'episodes'
  //    ]
  //    next()
  //  }
  //  , requestSprite)

  app.get('*'
    , function (req, res, next) {
      invalidRequest(res)
    })

  handle = app.listen(options.port)
  log.info('Listening on port ', options.port)
  return handle
}

function clean (options) {
  var paths = [
    options.originalsPath,
    options.outDir
  ]
  return paths.reduce(function (prev, curr, indx, arr) {
    return prev.then(function () {
      var glob = path.join(curr, '*')
      return remove(glob)
    })
  }, Promise.resolve())
    .then(function () {
      readdir(options.tmpDir)
        .then(function (files) {
          return files.reduce(function (prev, curr, indx, arr) {
            return prev.then(function () {
              if (curr.indexOf('.gitignore') === -1) {
                return remove(path.join(options.tmpDir, curr))
              }
            })
          }, Promise.resolve())
        })
    })
}

function manip (options) {
  return imageMagickInstalled(options.convertPath)
    .then(function (is) {
      if (is) {
        throw new Error('Not Implemented')
      } else {
        /* This next section will become obsolete once vjs method convert handles empty arrays */
        if (!options.manip.map) {
          return []
        }
        /* end */
        return Promise.all(options.manip.map(function (item) {
          return manipulate(options, item)
        }))
      }
    })
}

function manipulate (options, item) {
  return stat(item.src)
    .then(function (stats) {
      if (item.batch) {
        return manipulateBatch(item, options, stats.size)
      } else {
        return manipulateSingle(item, options, stats.size)
      }
    })
}

function manipulateSingle (item, options, size) {
  return createDir(item.dst)
    .then(function () {
      return new Promise(function (resolve, reject) {
        var rs = fs.createReadStream(item.src)
        var qsOpts = clone(item)
        delete qsOpts.src
        delete qsOpts.dst
        var url = '/image?' + qs.stringify(qsOpts)
        var req = http.request({
          path: url,
          method: 'POST',
          host: options.remote,
          port: options.remotePort,
          agent: httpAgent,
          headers: {
            'Content-Length': size,
            'Content-Type': 'image/jpeg'
          }
        }, function (res) {
          res.on('error', reject)
          if (res.statusCode === 200) {
            var out = item.dst
            var ws = fs.createWriteStream(out)
            res.pipe(ws)
          } else {
            var error = new Error('!200')
            error.info = { res: res }
            reject(error)
          }
          res.on('end', function () {
            resolve(item)
          })
        })
        req.on('error', reject)
        rs.pipe(req).on('error', reject)
      })
    })
}

function manipulateBatch (item, options, size) {
  return createDirs(item.batch)
    .then(function () {
      return new Promise(function (resolve, reject) {
        var rs = fs.createReadStream(item.src)
        var url = '/batch?items=' + encodeURIComponent(JSON.stringify(item.batch))
        var reqOptions = {
          path: url,
          method: 'POST',
          host: options.remote,
          port: options.remotePort,
          agent: httpAgent,
          headers: {
            'Content-Length': size,
            'Content-Type': 'image/jpeg'
          }
        }
        // console.log('options', reqOptions)
        var req = http.request(reqOptions, function (res) {
          res.on('error', reject)
          var error
          var ws
          var errConcat
          var erroring = false
          if (res.statusCode === 200) {
            res.on('data', function (chunk) {
              if (chunk.slice(0, separatorPrefixBuf.length).equals(separatorPrefixBuf)) {
                if (erroring) {
                  log.error('shit hit the fan', errConcat)
                }
                if (chunk.slice(-(separatorErrorSuffixBuf.length)).equals(separatorErrorSuffixBuf)) {
                  errConcat = ''
                  erroring = true
                } else {
                  // log.info('receiving', chunk.toString().slice(separatorPrefix.length))
                  erroring = false
                  if (ws) {
                    ws.end()
                  }
                  var dst = chunk.toString().slice(separatorPrefix.length)

                  ws = fs.createWriteStream(dst)
                }
              } else {
                if (erroring) {
                  errConcat += chunk.toString()
                } else {
                  ws.write(chunk)
                }
              }
            })
          } else {
            error = new Error('!200')
            error.info = { res: res }
            res.on('data', noop)  // This allows§ the `end` event to be fired
          }
          res.on('end', function () {
            if (ws) {
              ws.end()
            }
            if (error) {
              reject(error)
            } else {
              resolve()
            }
          })
        })
        req.on('error', reject)
        rs.pipe(req).on('error', reject)
      })
    })
}

function createDirs (items) {
  var promises = items.map(function (item) {
    return createDir(item.dst)
  })
  return Promise.all(promises)
}

function createDir (pth) {
  return mkdirp(pth.slice(0, pth.lastIndexOf('/')))
}

function noop () {}

function imageMagickInstalled (convertPath) {
  return new Promise(function (resolve, reject) {
    exec(convertPath + ' -version', function (error, stdout, stderr) {
      if (error) {
        resolve(false)
      } else if (stdout.indexOf('ImageMagick') === -1) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

function morePrep (options) {
  return function (req, res, next) {
    req.url = req.query.url
    req.pathToOriginal = path.join(options.originalsPath, hash(req.url))
    next()
  }
}

function morePrepPost (options) {
  return function (req, res, next) {
    var disc = Math.random()
    req.pathToOriginal = path.join(options.originalsPath, 'POSTEDIMAGE' + disc)
    var ws = fs.createWriteStream(req.pathToOriginal)
    req.pipe(ws)
    req.on('error', function (err) {
      console.error('Error streaming POSTed file to disk', err)
      res.status(500).end()
    })
    req.on('end', function () {
      next()
    })
  }
}

// download original image
// to `originals/` directory
function imageDownload (req, res, next) {
  // log.info('req.pathToOriginal'.red, req.pathToOriginal)
  // log.info('url'.red, req.url)

  fs.exists(req.pathToOriginal, function (exists) {
    if (exists) {
      next()
    } else {
      // log.info("Downloading original image".cyan)

      fs.writeFile(req.pathToOriginal, req.url, {
        maxTries: options.maxTries,
        retryOn404: true // MTV's image server sometimes returns 404 even if image does exists, i.e. retrying may work
      }, function (err) {
        var status
        if (err) {
          err.details = 'vigour-fs.write (download) error'
          err.path = req.pathToOriginal
          err.data = req.url
          status = err.statusCode || 500
          res.status(status).end(JSON.stringify(err, null, ' '))
          util.cleanup(req.tmpDir)
        } else {
          next()
        }
      })
    }
  })
}

function imageTransform (req, res, next) {
  imgManip.effect(
    req.query,
    req.pathToOriginal,
    req.dimensions,
    req.out
  ).then(effectThen(req, next), effectCatch(req, res))
}

function effectThen (req, next, item) {
  return function (newPath) {
    req.newPath = newPath
    next()
    return item
  }
}

function effectCatch (req, res) {
  return function (reason) {
    reason.details = 'imgManip.effect error'
    reason.query = req.query
    reason.path = req.pathToOriginal
    reason.dimensions = req.dimensions
    reason.out = req.out
    log.error('EFFECT CATCH', reason)
    res.status(500).end(
      JSON.stringify(reason, null, ' ')
    )
    util.cleanup(req.tmpDir)
  }
}

function serveTransformed (req, res, next) {
  serve(res, req.newPath, req.cacheForever, function (err) {
    if (err) {
      log.error('Error serving file', req.newPath, err)
    } else {
      if (req.query.cache === 'false') {
        remove(req.newPath)
        remove(req.pathToOriginal)
      }
      util.cleanup(req.tmpDir)
    }
  })
}

function serveCached (req, res, next) {
  var filePath = req.out + '.jpg'
  serveIfExists(filePath
    , req.cacheForever
    , res
    , function (err) {
      if (err) {
        filePath = req.out + '.png'
        serveIfExists(filePath
          , req.cacheForever
          , res
          , function (err) {
            if (err) {
              next()
            }
          })
      }
    })
}

function serveIfExists (path, cacheForever, res, cb) {
  fs.exists(path, function (exists) {
    if (exists) {
      serve(res, path, cacheForever)
      cb(null)
    } else {
      cb(true)
    }
  })
}

function cacheForever (bool) {
  return function (req, res, next) {
    if (bool) {
      if (req.query.cache !== undefined) {
        req.cacheForever = !(req.query.cache === 'false')
      } else {
        req.cacheForever = true
      }
    }
    next()
  }
}

function serve (res, path, cacheForever, cb) {
  setHeaders(res, cacheForever)
  res.sendFile(path
    , function (err) {
      if (err) {
        err.message += ': sendFile error'
        if (err.code === 'ECONNABORT' && res.statusCode === 304) {
          // log.info('sent 304 for', path)
        } else {
          log.error('Error sending file', err)
          // TODO Warn dev
        }
      } else {
        // log.info("sendFile succeeds", path)
      }
      if (cb) {
        cb(err)
      }
    })
}

function makeOutPost (req, res, next) {
  var disc = Math.random()
  req.out = path.join(options.outDir, 'POSTEDIMAGE' + disc)
  next()
}

function makeOut (req, res, next) {
  // log.info('making out')
  try {
    req.out = path.join(options.outDir, hash(req.originalUrl))
    next()
  } catch (e) {
    invalidRequest(res)
  }
}

function invalidRequest (res) {
  // log.info('Serving 400')
  res.status(400).end(options.invalidRequestMessage)
}

function prepare (fromQuery) {
  return function (req, res, next) {
    req.tmpDir = path.join(options.tmpDir, Math.random().toString().slice(1))
    fs.mkdir(req.tmpDir, function (err) {
      if (err) {
        err.detail = 'fs.mkdir error'
        err.path = req.tmpDir
        res.status(500).end(JSON.stringify(err, null, ' '))
      } else {
        if (fromQuery) {
          req.dimensions = {
            width: req.query.width,
            height: req.query.height
          }
        } else {
          req.dimensions = {
            width: req.params.width,
            height: req.params.height
          }
        }
        next()
      }
    })
  }
}

// function checkSpace () {
//   return new Promise(function (resolve, reject) {
//     // log.info("Checking disk space")
//     diskspace.check('/', function (err, total, free, status) {
//       var percent
//         , msg
//       if (err) {
//         log.error("Error checking disk space", err)
//         reject(err)
//       } else {
//         if (status !== 'READY') {
//           log.warn("Can't get disk space")
//           log.warn("status", status)
//           reject()
//         } else {
//           msg = "Free space left: " + free/total
//               + " \ 1 AKA ( " + Math.round(100*free/total) + "% )"
//           if (free/total < options.minFreeSpace) {
//             log.warn(msg)
//             log.info("Erasing all cached images")
//             resolve(Promise.all(
//               util.empty(options.originalsPath)
//               , util.empty(options.outDir)))
//           } else {
//             log.info(msg)
//             resolve()
//           }
//         }
//       }
//     })
//   })
// }

// function requestSprite (req, res, next) {
//  log.info('requesting sprite')
//  spriteMaker.requestSprite(req.pathToSpriteData
//    , data
//    , req.params
//    , req.tmpDir
//    , req.dimensions
//    , req.out
//    , function (err, spritePath, cb) {
//      if (err) {
//        err.pathToSpriteData = req.pathToSpriteData
//        err.params = err.params
//        log.error('spriteMaker.requestSprite error', err)
//        res.status(err.status).end(JSON.stringify(err, null, " "))
//      } else {
//        log.info("Serving sprite")
//        serve(res, spritePath, req.cacheForever, function (err) {
//          util.cleanup(req.tmpDir)
//        })
//      }
//    })
// }
