var Promise = require('promise')
  , path = require('path')
  , express = require('express')
  , bodyParser = require('body-parser')
  , jsonParser = bodyParser.json()
  , expressValidator = require('express-validator')
  , validate = require('./validation')
  , log = require('npmlog')
  , colors = require('colors')
  , marked = require('marked')
  , diskspace = require('diskspace')
  , hash = require('vigour-js/util/hash.js')
  , fs = require('vigour-fs')
  , remove = Promise.denodeify(fs.remove)
  , readdir = Promise.denodeify(fs.readdir)

  // , spriteMaker = require('./spriteMaker')
  , imgManip = require('./imgManip')
  , util = require('./util')
  , setHeaders = require('./setHeaders')

  , unlink = Promise.denodeify(fs.unlink)
  , options

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
  var handle

  options = _options
  if (options.clean) {
    return clean(options)
  }
  validate.init(options)
  imgManip.init(options)
  app = express();

  // app.use(function (req, res, next) {
  //   console.log(req.method, req.originalUrl)
  //   next()
  // })

  // app.use(bodyParser.urlencoded({
  //   extended: true
  // }))

  app.use(expressValidator())

  // use README.md file as a homepage
  app.get('/', function(req, res) {
    res.set('content-type','text/html')
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
      , stripped = req.originalUrl.slice(1)
      , target = stripped.slice(stripped.indexOf('/'))


    paths.out = path.join(options.outDir, encodeURIComponent(target))
    if (req.query.url) {
      paths.original = req.query.url.slice(req.query.url.lastIndexOf('/') + 1)
    } else {
      if (target.indexOf("/image/") === 0) {
        target = target.slice(7)
        target = target.slice(0, target.indexOf('/'))
      }
      paths.original = target
    }
    paths.original = path.join(options.originalsPath, paths.original)
    Promise.all(unlink(paths.out + '.jpg'), unlink(paths.out + '.png'), unlink(paths.original))
      .then(function (results) {
        // console.log('Erased', paths.out)
        // console.log('Erased', paths.original)
        res.end(JSON.stringify(paths, null, 2))
      })
      .catch(function (reason) {
        console.error('Failed to remove cache', reason)
        res.status(500).end("Failed")
      })
  })

  app.post('/image/'
    , validate.dimensions
    , validate.effects
    , makeOut
    , prepare
    , function (req, res, next) {
      req.pathToOriginal = path.join(req.tmpDir, 'original')
      var ws = fs.createWriteStream(req.pathToOriginal)
      req.pipe(ws)
      req.on('error', function (err) {
        console.error('Oops', err)
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

      req.pathToOriginal = path.join(options.originalsPath, req.query.url.slice(req.query.url.lastIndexOf('/') + 1))
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
    , function(req, res, next) {
      var url = util.urlFromId(req.params.id)
      req.url = url
      req.pathToOriginal = path.join(options.originalsPath, url.slice(url.lastIndexOf('/') + 1))

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
  //  console.log('cloud welcome')
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
  //  console.log("Listen called")
    handle = app.listen(options.port)
    console.log('Listening on port ', options.port)
  //  this.removeListener(listen)
  // }
  return handle
}

function clean (options) {
  var paths =
    [ options.originalsPath
    , options.outDir
    ]
  return paths.reduce(function (prev, curr, indx, arr) {
    return prev.then(function () {
      var glob = path.join(curr, "*")
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


// download original image
// to `originals/` directory
function imageDownload(req, res, next) {
  // console.log('req.pathToOriginal'.red, req.pathToOriginal)
  // console.log('url'.red, req.url)

  fs.exists(req.pathToOriginal, function(exists) {
    if (exists) {
      next()
    } else {

      // log.info("Downloading original image".cyan)

      fs.writeFile(req.pathToOriginal, req.url, {
        maxTries: options.maxTries,
        retryOn404: true // MTV's image server sometimes returns 404 even if image does exists, i.e. retrying may work
      }, function(err) {
        if (err) {
          err.details = 'vigour-fs.write (download) error'
          err.path = req.pathToOriginal
          err.data = req.url
          log.error(err.details, err)
          res.status(500).end(JSON.stringify(err, null, " "))
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
  // console.log("Transforming image".green)

  // image manipulation using imageManip
  imgManip.effect(
    req.query,
    req.pathToOriginal,
    req.dimensions,
    req.out,
    function(err, newPath) {
      if (err) {
        err.details = "imgManip.effect error"
        err.query = req.query
        err.path = req.pathToOriginal
        err.dimensions = req.dimensions
        err.out = req.out

        res.status(500).end(
          JSON.stringify(err, null, " ")
        )
        util.cleanup(req.tmpDir)
      } else {
        // console.log("Serving image".green)

        serve(res, newPath, req.cacheForever, function(err) {
          util.cleanup(req.tmpDir)
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
        req.cacheForever = (req.query.cache === "false") ? false : true
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
        err.message += ": sendFile error"
        if (err.code === "ECONNABORT" && res.statusCode === 304) {
          // log.info('sent 304 for', path)
        } else {
          log.error('Error sending file', err)
          // TODO Warn dev
        }
      } else {
        // console.log("sendFile succeeds", path)
      }
      if (cb) {
        cb(err)
      }
    })
}

function makeOut (req, res, next) {
  // console.log('making out')
  try {
    req.out = path.join(options.outDir, hash(req.originalUrl))
    next()
  } catch (e) {
    invalidRequest(res)
  }
}

function invalidRequest (res) {
  // console.log('Serving 400')
  res.status(400).end(options.invalidRequestMessage)
}

function prepare (req, res, next) {
  // checkSpace()
  //   .catch(function (reason) {
  //     log.error("Error checking space or removing files", reason)
  //     throw reason
  //   })
  //   .then(function () {
      req.tmpDir = path.join(options.tmpDir, Math.random().toString().slice(1))
      // log.info('creating temp directory')
      fs.mkdir(req.tmpDir, function (err) {
        if (err) {
          err.detail = 'fs.mkdir error'
          err.path = req.tmpDir
          res.status(500).end(JSON.stringify(err, null, " "))
        } else {
          req.dimensions = {
            width: req.params.width
            , height: req.params.height
          }
          next()
        }
      })
    // })
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
//  console.log('requesting sprite')
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
//        console.log("Serving sprite")
//        serve(res, spritePath, req.cacheForever, function (err) {
//          util.cleanup(req.tmpDir)
//        })
//      }
//    })
// }