var http = require('http')
var imgServer = require('../../')
var sampleImage = "https://upload.wikimedia.org/wikipedia/commons/8/8c/JPEG_example_JPG_RIP_025.jpg"
var encoded = encodeURIComponent(sampleImage)
var base = "/image/600/400?cache=false&url=" + encoded
var host = "localhost"
// var host = "shawn.vigour.io"
var port = 8000
// var port = 8040
var handle

describe("Routes", function () {
	before(function (done) {
		this.timeout(5000)
		imgServer()
			.then(function (_handle) {
				handle = _handle
				done()
			})
	})
	describe("GET /image/:width/:height", function () {
		describe("Effects", function () {
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
			effects.map(function (effect) {
				var fullPath = base + effect
				it("`" + effect + "`", attempt(fullPath))
			})
		})
	})
	describe("GET /image/:id/:width/:height", function () {
		it("should find the correct image and serve a resized version"
			, attempt("/image/310b69fb4db50d3fc4374d2365cdc93a/900/600"))
	})
	after(function (done) {
		handle.close(function () {
			done()
		})
	})
})

function attempt (fullPath) {
	return function (done) {
		var reqOptions =
			{ path: fullPath
			, port: port
			, hostname: host
			}
		// console.log("reqOptions", reqOptions)
		var req = http.request(reqOptions
		, function (res) {
			var total = ""
			res.on('error', function (err) {
				console.error("res error", err)
				expect(err).not.to.exist
				done()
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
				if (res.statusCode !== 200) {
					res.on('data', function (chunk) {
						total += chunk
					})
					res.on('end', function () {
						console.log("RESULT", total)
					})
				}
				done()
			}
		})
		req.on('error', function (err) {
			console.error("req error", err)
			expect(err).not.to.exist
			done()
		})
		req.end()
	}
}