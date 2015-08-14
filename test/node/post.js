var path = require('path')
var http = require('http')
var imgServer = require('../../')
var sampleImage = path.join(__dirname, '..', 'data', 'sample.jpg')
var fs = require('vigour-fs')
var Promise = require('promise')
var stat = Promise.denodeify(fs.stat)
var hash = require('vigour-js/util/hash.js')
var handle

describe("POST /image/:width/:height", function () {
	var base = "/image/600/400?"
	var effects =
		[ ""
		, "&effect=smartResize"
		, "&effect=composite&overlay=overlay"
		, "&effect=blur&radius=0&sigma=3"
		, "&effect=tMask&mask=avatarMask"
		, "&effect=mask&mask=logoMask&fillColor=EE255C"
		, "&effect=overlay&overlay=overlay"
		, "&effect=tMask&mask=logoMask"
		, "&effect=overlayBlur&overlay=overlay&radius=0&sigma=3"
		]

	before(function (done) {
		this.timeout(5000)
		imgServer()
			.then(function (_handle) {
				handle = _handle
				done()
			})
	})

	effects.map(function (effect) {
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
	return function (done) {
		stat(sampleImage)
			.then(function (stats) {
				var rs = fs.createReadStream(sampleImage)
				var req = http.request(
					{ path: fullPath
					, port: 8000
					, method: "POST"
					, headers:
						{ "Content-Length": stats.size
						, "Content-Type": "image/jpeg"
						}
					}
				, function (res) {
					res.on('error', function (err) {
						console.error("err", err, err.stack)
						expect(err).not.to.exist
					})
					if (res.statusCode !== 200) {
						res.on('data', function (chunk) {
							console.log("CHUNK", chunk.toString())
						})
						res.on('end', function () {
							expect(true).to.equal(false)
						})
					} else {
						expect(res.statusCode).to.equal(200)
						var out = path.join(__dirname, 'out', effect || "noEffect")
						var ws = fs.createWriteStream(out)
						res.pipe(ws)
						res.on('error', function (err) {
							console.error("NOOOO", err)
							expect(true).to.equal(false)
						})
						res.on('end', function () {
							expect(true).to.equal(true)
							done()	
						})
					}
				})
				req.on('error', function (err) {
					expect(err).not.to.exist
				})
				rs.pipe(req).on('error', function (err) {
					expect(err).not.to.exist
				})
			})
	}
}