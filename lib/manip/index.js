'use strict'

var http = require('http')
var httpAgent = new http.Agent({ maxSockets: 8 })
var exec = require('child_process').exec

var log = require('npmlog')
var clone = require('lodash/lang/clone')

var fs = require('vigour-fs-promised')
var qs = require('query-string')

module.exports = exports = function () {
  var self = this
  return imageMagickInstalled(this.config.convertPath.val)
    .then(function (is) {
      if (is) {
        throw new Error('Not Implemented')
      } else {
        /* This next section will become obsolete once vigour-js' plain method handles empty arrays */
        if (!self.config.manip.plain().map) {
          return []
        }
        /* end */
        return Promise.all(self.config.manip.plain().map(function (item) {
          return manipulate(self.config, item)
        }))
      }
    })
}

function manipulate (options, item) {
  // console.log('src', item.src)
  return fs.statAsync(item.src)
    .then(function (stats) {
      if (item.batch) {
        console.log('BATCH')
        return manipulateBatch(item, options, stats.size)
      } else {
        console.log('SINGLE')
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
          host: options.remote.val,
          port: options.remotePort.val,
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
          host: options.remote.val,
          port: options.remotePort.val,
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
              if (chunk.slice(0, options.separatorPrefixBuf.val.length).equals(options.separatorPrefixBuf.val)) {
                if (erroring) {
                  log.error('shit hit the fan', errConcat)
                }
                if (chunk.slice(-(options.separatorErrorSuffixBuf.val.length)).equals(options.separatorErrorSuffixBuf.val)) {
                  errConcat = ''
                  erroring = true
                } else {
                  // log.info('receiving', chunk.toString().slice(separatorPrefix.length))
                  erroring = false
                  if (ws) {
                    ws.end()
                  }
                  var dst = chunk.toString().slice(options.separatorPrefix.val.length)

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
            res.on('data', noop)  // This allows the `end` event to be fired
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

function noop () {}

function createDirs (items) {
  var promises = items.map(function (item) {
    return createDir(item.dst)
  })
  return Promise.all(promises)
}

function createDir (pth) {
  return fs.mkdirpAsync(pth.slice(0, pth.lastIndexOf('/')))
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
