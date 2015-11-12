'use strict'

var path = require('path')
var Shutter = require('../../')
var handle
var srcPath = path.join(__dirname, '..', 'data', 'sam ple.jpg')
var outPath = path.join(__dirname, 'out', 'haha.png')
var outPath_two = path.join(__dirname, 'out', 'hoho.png')

describe('Manip', function () {
  before(function () {
    this.timeout(5000)
    var shutter = new Shutter()
    return shutter.start()
      .then(function (_handle) {
        handle = _handle
      })
  })
  after(function (done) {
    handle.close(function () {
      done()
    })
  })

  it('should succeed immediately if no manipulations are provided'
  , function () {
    var shutter = new Shutter({
      convertPath: 'forceUseOfRemote',
      remote: 'localhost',
      remotePort: '8000',
      manip: []
    })
    return shutter.start()
      .then(function (val) {
        expect(val).to.be.an.array
      })
  })

  it('should perform an array or manipulations'
  , function () {
    // afterEach(function () {
    //   return unlink(outPath)
    //     .then(function () {
    //       return unlink(outPath_two)
    //     })
    // })
    this.timeout(20000)
    var shutter = new Shutter({
      convertPath: 'forceUseOfRemote',
      remote: 'localhost',
      remotePort: '8000',
      manip: [{
        src: srcPath,
        dst: outPath,
        width: 300,
        height: 300
      }, {
        src: srcPath,
        dst: outPath_two,
        width: 250,
        height: 250
      }]
    })
    return shutter.start()
      .then(function (val) {
        expect(val).to.be.an.array
      })
  })

  it('should preform batch operations'
  , function () {
    this.timeout(20000)
    var shutter = new Shutter({
      convertPath: 'haha',
      remote: 'localhost',
      remotePort: '8000',
      manip: [{
        src: srcPath,
        batch: [{
          dst: outPath,
          width: 200,
          height: 200
        }, {
          dst: outPath_two,
          width: 150,
          height: 150
        }]
      }]
    })
    return shutter.start()
  })
})
