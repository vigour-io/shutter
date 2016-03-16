'use strict'

var path = require('path')
var Shutter = require('../../')
var fs = require('vigour-fs/lib/server')
var Promise = require('promise')
var writeFile = Promise.denodeify(fs.writeFile)
var attempt = require('../attempt')
var expectCachedFiles = require('../expectCachedFiles')
var sampleImage = 'https://upload.wikimedia.org/wikipedia/commons/8/8c/JPEG_example_JPG_RIP_025.jpg'
var encoded = encodeURIComponent(sampleImage)
var base = '/image/600/400?url=' + encoded
var baseWidthHeight = '/image?width=600&height=400&url=' + encoded
// var baseWH = '/image?w=600&h=400&url=' + encoded
// var baseDimensions = '/image?dimensions=600x400&url=' + encoded
// var baseD = '/image?d=600x400&url=' + encoded
var host = 'localhost'
var port = 8000
var handle
var root = process.cwd()
var outPath = path.join(root, 'out')
var originalsPath = path.join(root, 'originals')

describe('Clean', function () {
  beforeEach(function (done) {
    writeFile(path.join(outPath, 'tmpTestFile.txt'), 'Hello World', 'utf8')
      .then(function () {
        return writeFile(path.join(originalsPath, 'tmpTestFiles.txt'), 'Hello World', 'utf8')
      })
      .done(done)
  })
  it('should clean `out/` and `originals/`', function (done) {
    expectCachedFiles(true)
      .then(function () {
        var shutter = new Shutter({ clean: true })
        return shutter.start()
      })
      .then(function () {
        return expectCachedFiles(false)
      })
      .done(done)
  })
})

describe('Routes', function () {
  before(function () {
    this.timeout(5000)
    var shutter = new Shutter()
    return shutter.start()
      .then(function (_handle) {
        handle = _handle
      })
  })

  describe('GET /image/:width/:height', function () {
    describe('Effects', function () {
      this.timeout(5000)
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
      attempts.map(function (effect) {
        var fullPath = base + effect
        it('`' + effect + '`', attempt(fullPath, port, host))
      })
    })
  })

  describe('GET /image', function () {
    describe('?width=600&height=400', function () {
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
      attempts.map(function (effect) {
        var fullPath = baseWidthHeight + effect
        it('`' + effect + '`', attempt(fullPath, port, host))
      })
    })
  })

  // TODO Obsolete this
  describe('GET /image/:id/:width/:height', function () {
    this.timeout(30000)
    it('should find the correct image and serve a resized version'
      , attempt('/image/310b69fb4db50d3fc4374d2365cdc93a/900/600', port, host))
  })

  describe('Caching', function () {
    it('should be enabled by default', function (done) {
      expectCachedFiles(true)
        .done(done)
    })
    it('should be disabled by `&cache=false`', function (done) {
      var shutter = new Shutter({ clean: true })
      shutter.start()
        .then(function () {
          attempt(base + '&cache=false', port, host)()
            .then(function () {
              // Give it time to clean up
              setTimeout(function () {
                expectCachedFiles(false)
                  .done(done)
              }, 1000)
            })
        })
    })
  })

  after(function (done) {
    handle.close(done)
  })
})
