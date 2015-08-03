var http = require('http')
var imgServer = require('../../')
var sampleImage = "http://cdn.myfancyhouse.com/wp-content/uploads/2012/11/The-Grandiose-Margi-boutique-hotel-in-Vouliameni.-Athens-21.jpg"
var encoded = encodeURIComponent(sampleImage)
var base = "/image/600/400?url=" + encoded
var handle
describe("GET /image/:width/:height", function () {
	before(function (done) {
		this.timeout(5000)
		imgServer()
			.then(function (_handle) {
				handle = _handle
				done()
			})
	})
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
	after(function () {
		handle.close()
	})
})

function attempt (fullPath) {
	return function (done) {
		var req = http.request(
			{ path: fullPath
			, port: 8000
			}
		, function (res) {
			res.on('error', function (err) {
				expect(err).not.to.exist
				done()
			})
			expect(res.statusCode).to.equal(200)
			done()
		})
		req.on('error', function (err) {
			expect(err).not.to.exist
			done()
		})
		req.end()
	}
}