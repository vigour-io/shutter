var express = require('express'),
    Promise = require('promise'),
    fs = require('vigour-fs'),
    config = require('./lib/config'),
    util = require('./lib/util'),
    setHeaders = require('./lib/setHeaders'),

    expressValidator = require('express-validator'),
    validate = require('./lib/validation'),

    imgManip = require('./lib/imgManip'),

    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),

    diskspace = require('diskspace'),
    hash = require('vigour-js/util/hash.js'),
    multer = require('multer'),
    upload = multer({
      dest: config.originalsPath + '/'
    }),

    unlink = Promise.denodeify(fs.unlink),
    log = require('npmlog'),
    colors = require('colors'),
    marked = require('marked')

    // , Cloud = require('vigour-js/browser/network/cloud')
    //  .inject(require('vigour-js/browser/network/cloud/datacloud'))
    // , Data = require('vigour-js/data')
    // , spriteMaker = require('./lib/spriteMaker'),


    // , photos = upload.single('photo')

    // , cloud = new Cloud('ws://' + config.cloudHost + ':' + config.cloudPort)
    // , data = new Data(cloud.data.get(config.mtvCloudDataFieldName))

    // , subscribeObj = {}


module.exports = exports = {}


Object.defineProperty(Error.prototype, 'toJSON', {
  value: function() {
    var alt = {}

    Object.getOwnPropertyNames(this).forEach(function(key) {
      alt[key] = this[key]
    }, this)

    return alt
  },
  configurable: true
})


app = express()
app.use(expressValidator())

app.use(function(req, res, next) {
  console.log(req.method, req.originalUrl)
  next()
})

// use README.md file as a homepage
app.get('/', function(req, res) {
  res.set('content-type','text/html')
  res.send(
    '<style>' +
      fs.readFileSync('./node_modules/github-markdown-css/github-markdown.css') +
    '</style>' +
    '<div class="markdown-body">' +
      marked(
        fs.readFileSync(__dirname + '/README.md', 'utf8')
      ) +
    '</div>'
  )
  res.end()
})

// Issue a GET request to the following address
// to remove the corresponding image from cache
app.get('/invalidate/*', function(req, res, next) {
  var paths = {},
    stripped = req.originalUrl.slice(1)

  , target = stripped.slice(stripped.indexOf('/'))


  paths.out = config.outDir + '/' + encodeURIComponent(target)
  if (req.query.url) {
    paths.original = req.query.url.slice(req.query.url.lastIndexOf('/') + 1)
  } else {
    if (target.indexOf("/image/") === 0) {
      target = target.slice(7)
      target = target.slice(0, target.indexOf('/'))
    }
    paths.original = target
  }
  paths.original = config.originalsPath + '/' + paths.original
  Promise.all(unlink(paths.out + '.jpg'), unlink(paths.out + '.png'), unlink(paths.original))
    .then(function(results) {
      console.log('Erased', paths.out)
      console.log('Erased', paths.original)
      res.end(JSON.stringify(paths, null, 2))
    })
    .catch(function(reason) {
      console.error('Failed to remove cache', reason)
      res.status(500).end("Failed")
    })
})

// accept POST requests
app.post('/image/',
  upload.single('photo'),
  function(req, res, next) {

    log.info('POST request received!'.cyan)

    log.info('Body:')
    console.log(req.body)

    log.info('File:')
    console.log(req.file)

    if (!req.body || !req.file) return res.sendStatus(400)

    // that's kinda weird :)
    req.params = req.query = req.body
    req.pathToOriginal = config.originalsPath + '/' + req.file.filename

    next()
  },

  validate.dimensions,
  validate.effects,

  makeOut,
  prepare,

  function(req, res, next) {
    if (!req.params) return res.sendStatus(400)

    console.log(req.params)
    console.log(req.file)

    next()
  },

  imageTransform
)

// get and process image from the URL
app.get('/:image/:width/:height',
  validate.dimensions,
  validate.imgURL,
  validate.effects,

  cacheForever(true),
  makeOut,
  serveCached,
  prepare,

  function(req, res, next) {
    req.url = req.query.url
    req.pathToOriginal = config.originalsPath + '/' + req.query.url.slice(req.query.url.lastIndexOf('/') + 1)

    next()
  },

  imageDownload,
  imageTransform
)

// get and process image from the MTVPlay through it's unique id
app.get('/image/:id/:width/:height',
  validate.dimensions,
  validate.imgId,
  validate.effects,

  cacheForever(true),
  makeOut,
  serveCached,
  prepare,

  function(req, res, next) {
    req.url = util.urlFromId(req.params.id)
    req.pathToOriginal = config.originalsPath + '/' + req.params.id

    next()
  },

  imageDownload,
  imageTransform
)

// invalid request
app.get('*', function(req, res, next) {
  invalidRequest(res)
})

// app.get('/sprite/:country/:lang/shows/:width/:height'
//  , validate.dimensions
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
//  , validate.dimensions
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

// cloud.on('welcome', function (err) {
//  console.log('cloud welcome')
// })

// cloud.on('error', function (err) {
//  log.error('cloud error', err)
// })

// subscribeObj[config.mtvCloudDataFieldName] =  {
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


function listen() {
  log.info("Listen called".cyan)

  app.listen(config.port)
  console.log('Listening on port'.gray, config.port)

  // this.removeListener(listen)
}
listen()


// download original image
// to `originals/` directory
function imageDownload(req, res, next) {
  console.log('req.pathToOriginal'.red, req.pathToOriginal)
  console.log('url'.red, req.url)

  fs.exists(req.pathToOriginal, function(exists) {
    if (exists) {
      next()
    } else {

      log.info("Downloading original image".cyan)

      fs.writeFile(req.pathToOriginal, req.url, {
        maxTries: config.maxTries,
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
function imageTransform(req, res, next) {
  console.log("Transforming image".green)

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
        console.log("Serving image".green)

        serve(res, newPath, req.cacheForever, function(err) {
          util.cleanup(req.tmpDir)
        })
      }
    }
  )
}


function serveCached(req, res, next) {
  var filePath = req.out + '.jpg'

  serveIfExists(filePath, req.cacheForever, res,
    function(err) {
      if (err) {
        filePath = req.out + '.png'

        serveIfExists(filePath, req.cachedForever, res, function(err) {
          if (err) {
            next()
          }
        })
      }
    }
  )
}

function serveIfExists(path, cacheForever, res, cb) {
  fs.exists(path, function(exists) {
    if (exists) {
      log.info('Serving existing file'.cyan)
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

function serve(res, path, cacheForever, cb) {
  setHeaders(res, cacheForever)

  res.sendFile(path, {
    root: __dirname
  }, function(err) {
    if (err) {
      err.message += ": sendFile error"
      if (err.code === "ECONNABORT" && res.statusCode === 304) {
        log.info('sent 304 for', path)
      } else {
        log.error('Error sending file', err)
          // TODO Warn dev
      }
    } else {
      log.info("sendFile succeeds".cyan, path.toString().gray)
    }
    if (cb) {
      cb(err)
    }
  })
}

function makeOut(req, res, next) {
  log.info('Making out'.cyan)

  try {
    req.out = config.outDir + '/' + hash(req.originalUrl)
    next()
  } catch (e) {
    invalidRequest(res)
  }
}

function invalidRequest(res) {
  console.log('Serving 400')
  res.status(400).end(config.invalidRequestMessage)
}

function prepare(req, res, next) {
  checkSpace()
    .catch(function(reason) {
      log.error("Error checking space or removing files", reason)
      throw reason
    })
    .then(function() {
      req.tmpDir = config.tmpDir + '/' + Math.random().toString().slice(1)

      fs.mkdir(req.tmpDir, function(err) {

        if (err) {
          err.detail = 'fs.mkdir error'
          err.path = req.tmpDir
          res.status(500).end(JSON.stringify(err, null, " "))
        } else {
          req.dimensions = {
            width: req.params.width,
            height: req.params.height
          }
          next()
        }
      })
    })
}

function checkSpace() {
  return new Promise(function(resolve, reject) {

    log.info("Checking disk space".cyan)

    diskspace.check('/', function(err, total, free, status) {
      var percent, msg
      if (err) {
        log.error("Error checking disk space", err)
        reject(err)
      } else {
        if (status !== 'READY') {
          log.warn("Can't get disk space")
          log.warn("status", status)
          reject()
        } else {
          msg = "Free space left: " + free / total + " \ 1 AKA ( " + Math.round(100 * free / total) + "% )"

          if (free / total < config.minFreeSpace) {
            log.warn(msg)
            log.info("Erasing all cached images")
            resolve(Promise.all(
              util.empty(config.originalsPath), util.empty(config.outDir)))
          } else {
            log.info(msg)
            resolve()
          }
        }
      }
    })
  })
}

function requestSprite (req, res, next) {
 console.log('requesting sprite')
 spriteMaker.requestSprite(req.pathToSpriteData
   , data
   , req.params
   , req.tmpDir
   , req.dimensions
   , req.out
   , function (err, spritePath, cb) {
     if (err) {
       err.pathToSpriteData = req.pathToSpriteData
       err.params = err.params
       log.error('spriteMaker.requestSprite error', err)
       res.status(err.status).end(JSON.stringify(err, null, " "))
     } else {
       console.log("Serving sprite")
       serve(res, spritePath, req.cacheForever, function (err) {
         util.cleanup(req.tmpDir)
       })
     }
   })
}