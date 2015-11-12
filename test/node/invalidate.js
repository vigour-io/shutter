var Shutter = require('../../')
var attempt = require('../attempt')
var expectCachedFiles = require('../expectCachedFiles')
var port = 8000
var host = 'localhost'

describe('Invalidate', function () {
  var handle
  before(function () {
    var shutter = new Shutter({})
    return shutter.start()
      .then(function (_handle) {
        handle = _handle
      })
  })
  before(function () {
    var shutter = new Shutter({ clean: true })
    return shutter.start()
  })
  after(function (done) {
    handle.close(done)
  })

  it('should remove specified asset from cache', function () {
    this.timeout(60 * 1000)
    var url = '&url=http://webodysseum.com/wp-content/uploads/2012/06/Splendid-Photography-by-Dewan-Irawan-01.jpg'
    var paths = [
      '/image/20/20?' + url,
      '/image?width=20&height=20' + url]
    return Promise.all(paths.map(function (item) {
      return attempt(item, port, host)()
    }))
      .then(function () {
        return expectCachedFiles(true)
      })
      .then(function () {
        return Promise.all(paths.map(function (item) {
          return attempt('/invalidate' + item, port, host)()
        }))
          .then(function () {
            return expectCachedFiles(false)
              .then(function () {
              })
          })
      })
  })
})
