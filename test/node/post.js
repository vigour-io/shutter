/* global describe, it, expect, before, after */

var path = require('path')
var http = require('http')
var imgServer = require('../../')
var sampleImage = path.join(__dirname, '..', 'data', 'sam ple.jpg')
var fs = require('vigour-fs/lib/server')
var Promise = require('promise')
var stat = Promise.denodeify(fs.stat)
var handle

describe('POST /image/:width/:height', function () {
  var base = '/image/600/400?cache=false'
  // var base = "http://shawn.vigour.io:8040/image/600/400?"
  var effects =
    [ '',
    '&effect=smartResize',
    '&effect=composite&overlay=overlay',
    '&effect=blur&radius=0&sigma=3',
    '&effect=tMask&mask=avatarMask',
    '&effect=mask&mask=logoMask&fillColor=EE255C',
    '&effect=overlay&overlay=overlay',
    '&effect=tMask&mask=logoMask',
    '&effect=overlayBlur&overlay=overlay&radius=0&sigma=3'
    ]
  var png = effects.map(function (item) {
    return item + '&outType=png'
  })
  var jpg = effects.map(function (item) {
    return item + '&outType=jpg'
  })
  var attempts = effects.concat(png, jpg)

  before(function (done) {
    this.timeout(5000)
    imgServer()
      .then(function (_handle) {
        handle = _handle
        done()
      })
  })

  attempts.map(function (effect) {
    var fullPath = base + effect
    it(effect, attempt(fullPath, effect))
  })
  after(function (done) {
    handle.close(function () {
      done()
    })
  })
})

describe('POST /image', function () {
  var base = '/image?width=600&height=400&cache=false'
  // var base = "http://shawn.vigour.io:8040/image/600/400?"
  var effects =
    [ '',
    '&effect=smartResize',
    '&effect=composite&overlay=overlay',
    '&effect=blur&radius=0&sigma=3',
    '&effect=tMask&mask=avatarMask',
    '&effect=mask&mask=logoMask&fillColor=EE255C',
    '&effect=overlay&overlay=overlay',
    '&effect=tMask&mask=logoMask',
    '&effect=overlayBlur&overlay=overlay&radius=0&sigma=3'
    ]
  var png = effects.map(function (item) {
    return item + '&outType=png'
  })
  var jpg = effects.map(function (item) {
    return item + '&outType=jpg'
  })
  var attempts = effects.concat(png, jpg)

  before(function (done) {
    this.timeout(5000)
    imgServer()
      .then(function (_handle) {
        handle = _handle
        done()
      })
  })

  attempts.map(function (effect) {
    var fullPath = base + effect
    it(effect, attempt(fullPath, effect))
  })
  after(function (done) {
    handle.close(function () {
      done()
    })
  })
})

function attempt (fullPath, effect) {
  return function () {
    return stat(sampleImage)
      .then(function (stats) {
        return new Promise(function (resolve, reject) {
          var rs = fs.createReadStream(sampleImage)
          var req = http.request({
            path: fullPath,
            port: 8000,
            method: 'POST',
            headers: {
              'Content-Length': stats.size,
              'Content-Type': 'image/jpeg'
            }
          }, function (res) {
            var total = ''
            res.on('error', reject)
            if (res.statusCode === 200) {
              var out = path.join(__dirname, 'out', effect || 'noEffect')
              var ws = fs.createWriteStream(out)
              res.pipe(ws)
            } else {
              res.on('data', function (chunk) {
                total += chunk
              })
            }
            res.on('end', function () {
              if (res.statusCode !== 200) {
                console.error('RESULT', total.toString())
              }
              expect(res.statusCode).to.equal(200)
              resolve()
            })
          })
          req.on('error', reject)
          rs.pipe(req).on('error', reject)
        })
      })
      .catch(function (reason) {
        console.error('An error occured', reason)
        expect(reason).not.to.exist
      })
  }
}
