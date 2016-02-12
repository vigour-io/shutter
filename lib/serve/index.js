'use strict'

var log = require('npmlog')
var path = require('path')
var Promise = require('promise')
var express = require('express')
var expressValidator = require('express-validator')
var marked = require('marked')
var hash = require('vigour-js/lib/util/hash.js')
var fs = require('vigour-fs-promised')
var validate = require('../validation')
var imgManip = require('../imgManip')
var util = require('../util')

var setHeaders = require('../setHeaders')

module.exports = exports = function () {
  var self = this
  var handle
  validate.init(this.config)
  imgManip.init(this.config)
  var app = express()

  if (this.config.verbose.val) {
    app.use(logRequests)
  }

  // app.use(bodyParser.urlencoded({
  //   extended: true
  // }))

  app.use(expressValidator())

  // use README.md file as a homepage
  app.get('/', serveReadme)

  app.get('/invalidate/*'
    , function (req, res, next) {
      req.originalUrl = req.originalUrl.slice('/invalidate'.length)
      next()
    }
    , makeOut.bind(self)
    , morePrep(self.config)
    , function (req, res, next) {
      Promise.all(fs.unlinkAsync(req.out + '.jpg')
          .catch(function (reason) {
            // ignore
          }),
        fs.unlinkAsync(req.out + '.png')
          .catch(function (reason) {
            // ignore
          }),
        fs.unlinkAsync(req.pathToOriginal)
          .catch(function (reason) {
            // ignore
          })
      )
        .then(function (results) {
          res.end(JSON.stringify([
            req.out,
            req.pathToOriginal
          ], null, 2))
        })
        .catch(function (reason) {
          log.error('Failed to remove cache', reason)
          res.status(500).end('Failed')
        })
    })

  app.post('/image/:width/:height'
    , validate.dimensions()
    , validate.effects
    , makeOutPost.bind(self)
    , prepare.call(self)
    , morePrepPost(self.config)
    , imageTransform
    , serveTransformed
  )

  app.post('/image'
    , validate.dimensions(true)
    , validate.effects
    , makeOutPost.bind(self)
    , prepare.call(self, true)
    , morePrepPost(self.config)
    , imageTransform
    , serveTransformed
  )

  app.get('/image/:width/:height'
    , validate.dimensions()
    , validate.imgURL
    , validate.effects
    , cacheForever(true)
    , makeOut.bind(self)
    , serveCached
    , prepare.call(self)
    , morePrep(self.config)
    , imageDownload.bind(self)
    , imageTransform
    , serveTransformed
  )

  app.get('/image'
    , validate.dimensions(true)
    , validate.imgURL
    , validate.effects
    , cacheForever(true)
    , makeOut.bind(self)
    , serveCached
    , prepare.call(self, true)
    , morePrep(self.config)
    , imageDownload.bind(self)
    , imageTransform
    , serveTransformed
  )

  app.post('/batch',
    morePrepPost(self.config),
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
          path.join(self.config.outDir.val, 'POSTEDIMAGE' + disc)
        ).then(function (newPath) {
          prom = prom.then(function () {
            return new Promise(function (resolve, reject) {
              var rs = fs.createReadStream(newPath)
              var separator = self.config.separatorPrefix.val + item.dst + self.config.separatorSuffix.val
              res.write(separator)
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
              res.write(self.separatorPrefix + item.dst + self.separatorErrorSuffix)
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
    , makeOut.bind(self)
    , serveCached
    , prepare.call(self)
    , function (req, res, next) {
      var url = util.urlFromId(req.params.id)
      req.url = url
      req.pathToOriginal = path.join(self.config.originalsPath.val, hash(url))

      next()
    }
    , imageDownload.bind(self)
    , imageTransform
    , serveTransformed
  )

  // app.get('/sprite/:country/:lang/shows/:width/:height'
  //  , validateDimensions()
  //  , cacheForever(false)
  //  , makeOut.bind(self)
  //  , serveCached
  //  , prepare.call(self)
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
  //  , makeOut.bind(self)
  //  , serveCached
  //  , prepare.call(self)
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
      invalidRequest.call(self, res)
    })
  return new Promise(function (resolve, reject) {
    handle = app.listen(self.config.port.val, '127.0.0.1', function () {
      log.info('Listening on 127.0.0.1:', self.config.port.val)
      resolve(handle)
    })
  })
}

function logRequests (req, res, next) {
  log.info(req.method, req.originalUrl)
  next()
}

// TODO Cache this page
function serveReadme (req, res, next) {
  res.set('content-type', 'text/html')
  Promise.all([
    path.join(__dirname, '..', '..', 'node_modules', 'github-markdown-css', 'github-markdown.css'),
    path.join(__dirname, '..', '..', 'README.md')
  ].map(function (item) {
    return fs.readFileAsync(item, 'utf8')
  }))
    .then(function (contents) {
      res.send(
        '<!doctype html>' +
        '<html>' +
        '<head>' +
        '<meta charset="utf-8">' +
        '<title>Shutter - README.md</title>' +
        '<style type="text/css">' +
        contents[0] +
        '</style>' +
        '</head>' +
        '<body>' +
        '<div class="markdown-body">' +
        marked(contents[1]) +
        '</div>' +
        '</body>' +
        '</html>'
      )
      res.end()
    })
    .catch((reason) => {
      log.error("Can't serve README.md", reason)
      res.status(200).send()
    })
}

function makeOutPost (req, res, next) {
  var disc = Math.random()
  req.out = path.join(this.config.outDir.val, 'POSTEDIMAGE' + disc)
  next()
}

function makeOut (req, res, next) {
  // log.info('making out')
  try {
    req.out = path.join(this.config.outDir.val, hash(req.originalUrl))
    next()
  } catch (e) {
    invalidRequest.call(this, res)
  }
}

function invalidRequest (res) {
  // log.info('Serving 400')
  res.status(400).end(this.config.invalidRequestMessage.val)
}

function prepare (fromQuery) {
  var self = this
  return function (req, res, next) {
    req.tmpDir = path.join(self.config.tmpDir.val, Math.random().toString().slice(1))
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

function morePrep (options) {
  return function (req, res, next) {
    req.url = req.query.url
    req.pathToOriginal = path.join(options.originalsPath.val, hash(req.url))
    next()
  }
}

function morePrepPost (options) {
  return function (req, res, next) {
    var disc = Math.random()
    req.pathToOriginal = path.join(options.originalsPath.val, 'POSTEDIMAGE' + disc)
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
  var self = this
  // log.info('req.pathToOriginal'.red, req.pathToOriginal)
  // log.info('url'.red, req.url)

  fs.exists(req.pathToOriginal, function (exists) {
    if (exists) {
      next()
    } else {
      // log.info("Downloading original image".cyan)

      fs.writeFile(req.pathToOriginal, req.url, {
        maxTries: self.config.maxTries.val,
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
        fs.removeAsync(req.newPath)
        fs.removeAsync(req.pathToOriginal)
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
