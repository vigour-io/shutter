var path = require('path')
var http = require('http')
var imgServer = require('../../')
var sampleImage = path.join(__dirname, '..', 'data', 'sample.jpg')
var fs = require('vigour-fs')
var Promise = require('promise')
var stat = Promise.denodeify(fs.stat)
var handle

describe("POST /image/:width/:height", function () {
	before(function (done) {
		this.timeout(5000)
		imgServer({ convertPath: "/usr/local/opt/imagemagick/bin/convert" })
			.then(function (_handle) {
				handle = _handle
				done()
			})
	})
	it("should serve a resized version of the posted image", function (done) {
		stat(sampleImage)
			.then(function (stats) {
				var rs = fs.createReadStream(sampleImage)
				var req = http.request(
					{ path: "/image/600/400"
					, port: 8000
					, method: "POST"
					, headers:
						{ "Content-Length": stats.size }
					}
				, function (res) {
					res.on('error', function (err) {
						console.error("err", err, err.stack)
						expect(err).not.to.exist
					})
					expect(res.statusCode).to.equal(200)
					done()
				})
				req.on('error', function (err) {
					expect(err).not.to.exist
				})
				rs.pipe(req).on('error', function (err) {
					expect(err).not.to.exist
				})
			})
	})
	after(function () {
		handle.close()
	})
})