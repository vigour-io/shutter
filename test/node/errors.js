'use strict'

var http = require('http')
var Shutter = require('../../')
var imgHandle
var express = require('express')
var server = express()
var serverHandle
var serverPort = 8001
server.use(function (req, res, next) {
  res.status(404).end()
})

describe('Errors', function () {
  before(function (done) {
    var s = false
    var i = false
    this.timeout(5000)
    serverHandle = server.listen(serverPort, '127.0.0.1', function () {
      s = true
      finish()
    })

    var shutter = new Shutter({ maxTries: 2 })
    imgHandle = shutter.start()
      .then(function (_imgHandle) {
        imgHandle = _imgHandle
        i = true
        finish()
      })
    function finish () {
      if (s && i) {
        done()
      }
    }
  })

  it('should send a 404 response when requested origin image is not found', function (done) {
    var req = http.request({
      path: '/image/400/600?url=http://localhost:' + serverPort,
      port: 8000
    }
    , function (res) {
      res.on('error', function (err) {
        console.error('res error', err)
        expect(err).not.to.exist
        done()
      })
      if (res.statusCode !== 404) {
        res.on('data', function (chunk) {
          console.log('CHUNK', chunk.toString())
        })
        res.on('end', function () {
          expect(res.statusCode).to.equal(404)
          done()
        })
      } else {
        expect(res.statusCode).to.equal(404)
        done()
      }
    })
    req.on('error', function (err) {
      console.error('req error', err)
      expect(err).not.to.exist
      done()
    })
    req.end()
  })

  after(function (done) {
    var serverClosed = false
    var imgServerClosed = false
    serverHandle.close(function () {
      serverClosed = true
      finish()
    })
    imgHandle.close(function () {
      imgServerClosed = true
      finish()
    })
    function finish () {
      if (serverClosed && imgServerClosed) {
        done()
      }
    }
  })
})
