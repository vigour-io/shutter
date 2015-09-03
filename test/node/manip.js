/* global describe, it, expect, before, after */

var path = require('path')
var imgServer = require('../../')
var handle

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
  it('should reach the remote server if ImageMagick is not installed'
  , function () {
    this.timeout(20000)
    var srcPath = path.join(__dirname, '..', 'data', 'sample.jpg')
    var outPath = path.join(__dirname, 'out', 'haha.png')
    return imgServer({
      convertPath: 'haha',
      remote: 'localhost',
      remotePort: '8000',
      manip: [{
        src: srcPath,
        dst: outPath,
        width: 300,
        height: 300
      }]
    })
      .then(function (val) {
        expect(val).to.be.an.array
      })
  })
})