var exec = require('child_process').exec
var http = require('http')
var Promise = require('promise')
var path = require('path')
var express = require('express')
var expressValidator = require('express-validator')
var validate = require('./validation')
var log = require('npmlog')
var marked = require('marked')
var hash = require('vigour-js/util/hash.js')
var fs = require('vigour-fs')
var stat = Promise.denodeify(fs.stat)
var remove = Promise.denodeify(fs.remove)
var readdir = Promise.denodeify(fs.readdir)

// var spriteMaker = require('./spriteMaker')
var imgManip = require('./imgManip')
var util = require('./util')
var setHeaders = require('./setHeaders')

var unlink = Promise.denodeify(fs.unlink)
var options

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
  // log.info("Options", options)
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
    , validate.dimensions
    , validate.effects
    , makeOut
    , prepare
    , function (req, res, next) {
      var disc = Math.random()
      req.pathToOriginal = path.join(options.originalsPath, 'POSTEDIMAGE' + disc)
      var ws = fs.createWriteStream(req.pathToOriginal)
      req.pipe(ws)
      req.on('error', function (err) {
        log.error('Oops', err)
        res.status(500).end()
      })
      req.on('end', function () {
        next()
      })
    }
    , imageTransform
  )

  app.get('/:image/:width/:height'
    , validate.dimensions
    , validate.imgURL
    , validate.effects
    , cacheForever(true)
    , makeOut
    , serveCached
    , prepare
    , function (req, res, next) {
      req.url = req.query.url
      req.pathToOriginal = path.join(options.originalsPath, hash(req.url))
      next()
    }
    , imageDownload
    , imageTransform
    )

  app.get('/image/:id/:width/:height'
    , validate.dimensions
    , validate.imgId
    , validate.effects
    , cacheForever(true)
    , makeOut
    , serveCached
    , prepare
    , function (req, res, next) {
      var url = util.urlFromId(req.params.id)
      req.url = url
      req.pathToOriginal = path.join(options.originalsPath, hash(url))

      next()
    }
    , imageDownload
    , imageTransform
    )
  // app.get('/sprite/:country/:lang/shows/:width/:height'
  //  , validateDimensions
  //  , cacheForever(false)
  //  , makeOut
  //  , serveCached
  //  , prepare
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
  //  , validateDimensions
  //  , cacheForever(false)
  //  , makeOut
  //  , serveCached
  //  , prepare
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

  // cloud.on('welcome', function (err) {
  //  log.info('cloud welcome')
  // })

  // cloud.on('error', function (err) {
  //  log.error('cloud error', err)
  // })

  // subscribeObj[options.mtvCloudDataFieldName] =  {
  //  $: {
  //    $: {
  //      shows: {
  //        $: {
  //          img: true
  //          , number: true
  //          , seasons: {
  //            $: {
  //              number: true
  //              , episodes: {
  //                $: {
  //                  img: true
  //                  , number: true
  //                }
  //              }
  //            }
  //          }
  //        }
  //      },
  //      channels: {
  //        $: {
  //          img: true
  //          , number: true
  //        }
  //      }
  //    }
  //  }
  // }

  // cloud.subscribe(subscribeObj)

  // data.addListener(listen)

  // function listen () {
  //  log.info("Listen called")
  handle = app.listen(options.port)
  log.info('Listening on port ', options.port)
  // this.removeListener(listen)
  // }
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
        return Promise.all(options.manip.map(function (item) {
          return manipulate(options, item)
        }))
      }
    })
}

function manipulate (options, item) {
  return stat(item.src)
    .then(function (stats) {
      var arr = []
      if (item.batch) {
        arr = item.batch.map(function (bItem) {
          bItem.src = item.src
          return manipulateSingle(options, bItem, stats)
        })
      } else {
        arr.push(manipulateSingle(options, item, stats))
      }
      return Promise.all(arr)
    })
}

function manipulateSingle (options, item, stats) {
  return new Promise(function (resolve, reject) {
    var rs = fs.createReadStream(item.src)
    var url = '/image/' + item.width + '/' + item.height + '?cache=false'
    var req = http.request({ path: url,
      method: 'POST',
      host: options.remote,
      port: options.remotePort,
      headers: {
        'Content-Length': stats.size,
        'Content-Type': 'image/jpeg'
      }
    }
    , function (res) {
      res.on('error', function (err) {
        reject(err)
      })
      if (res.statusCode === 200) {
        var out = item.dst
        var ws = fs.createWriteStream(out)
        res.pipe(ws)
        res.on('error', function (err) {
          reject(err)
        })
        res.on('end', function () {
          resolve(item)
        })
      } else {
        var error = new Error('!200')
        error.info = { res: res }
        reject(error)
      }
    })

    req.on('error', function (err) {
      reject(err)
    })

    rs.pipe(req).on('error', function (err) {
      reject(err)
    })
  })
}

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

// reused image transform for all requests
function imageTransform (req, res, next) {
  // log.info("Transforming image".green)

  // image manipulation using imageManip
  imgManip.effect(
    req.query,
    req.pathToOriginal,
    req.dimensions,
    req.out,
    function (err, newPath) {
      if (err) {
        err.details = 'imgManip.effect error'
        err.query = req.query
        err.path = req.pathToOriginal
        err.dimensions = req.dimensions
        err.out = req.out

        res.status(500).end(
          JSON.stringify(err, null, ' ')
        )
        util.cleanup(req.tmpDir)
      } else {
        // log.info("Serving image".green)

        serve(res, newPath, req.cacheForever, function (err) {
          if (err) {
            log.error('Error serving file', newPath, err)
          } else {
            if (req.query.cache === 'false') {
              remove(newPath)
              remove(req.pathToOriginal)
            }
            util.cleanup(req.tmpDir)
          }
        })
      }
    }
  )
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

function prepare (req, res, next) {
  req.tmpDir = path.join(options.tmpDir, Math.random().toString().slice(1))
  // log.info('creating temp directory')
  fs.mkdir(req.tmpDir, function (err) {
    if (err) {
      err.detail = 'fs.mkdir error'
      err.path = req.tmpDir
      res.status(500).end(JSON.stringify(err, null, ' '))
    } else {
      req.dimensions = {
        width: req.params.width,
        height: req.params.height
      }
      next()
    }
  })
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
