'use strict'

var http = require('http')
var httpAgent = new http.Agent({ maxSockets: 8 })
var exec = require('child_process').exec

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
  return fs.statAsync(item.src)
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
          var separator = ''
          var dst
          var prefix = options.separatorPrefix.val
          var suffix = options.separatorSuffix.val
          var prefixLength = prefix.length
          var suffixLength = suffix.length
          var cancel = false
          var ws
          var error
          if (res.statusCode === 200) {
            res.on('data', function (chunk) {
              if (!cancel) {
                var chunkStr = chunk.toString()
                if (separator === '') {
                  // Does the chunk begin the same way as the prefix?
                  if (chunkStr.slice(0, prefixLength) === prefix.slice(0, chunkStr.length)) {
                    separator += chunkStr
                    // Does the separator contain the full prefix?
                    if (separator.length >= prefixLength) {
                      // Does the separator end with a suffix?
                      if (separator.length > suffixLength &&
                        separator.slice(-(suffixLength)) === suffix) {
                        dst = separator.slice(prefixLength, separator.length - suffixLength)
                        if (ws) {
                          ws.end()
                        }
                        // console.log('dst1', dst)
                        ws = fs.createWriteStream(dst)
                        separator = ''
                      }
                    }
                  } else {
                    if (ws) {
                      ws.write(chunk)
                    } else {
                      error = new Error('Malformed data')
                      error.info = "Invalid data sent by remote: doesn't start with a separator"
                      cancel = true
                      reject(error)
                    }
                  }
                } else {
                  separator += chunkStr
                  // Does the separator contain the full prefix?
                  if (separator.length >= prefixLength) {
                    // Does the separator end with a suffix?
                    if (separator.length > suffixLength &&
                      separator.slice(-(suffixLength)) === suffix) {
                      dst = separator.slice(prefixLength, separator.length - suffixLength)
                      if (ws) {
                        ws.end()
                      }
                      // console.log('dst2', dst)
                      ws = fs.createWriteStream(dst)
                      separator = ''
                    }
                  }
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
