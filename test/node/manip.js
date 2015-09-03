/* global describe, it, expect, before, after */

var path = require('path')
var Promise = require('promise')
var fs = require('vigour-fs')
var unlink = Promise.denodeify(fs.unlink)
var imgServer = require('../../')
var handle
var srcPath = path.join(__dirname, '..', 'data', 'sample.jpg')
var outPath = path.join(__dirname, 'out', 'haha.png')
var outPath_two = path.join(__dirname, 'out', 'hoho.png')

describe('Manip', function () {
  before(function () {
    this.timeout(5000)
    return imgServer()
      .then(function (_handle) {
        handle = _handle
      })
  })
  after(function (done) {
    handle.close(function () {
      done()
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
    return imgServer({
      convertPath: 'haha',
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
      .then(function (val) {
        expect(val).to.be.an.array
      })
  })

  it('should preform batch operations'
  , function () {
    this.timeout(20000)
    return imgServer({
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
  })
})
