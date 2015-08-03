var http = require('http')
var imgServer = require('../../')
var sampleImage = "http://cdn.myfancyhouse.com/wp-content/uploads/2012/11/The-Grandiose-Margi-boutique-hotel-in-Vouliameni.-Athens-21.jpg"
var handle
describe("GET /image/:width/:height?url=...", function () {
	before(function (done) {
		this.timeout(5000)
		imgServer()
			.then(function (_handle) {
				handle = _handle
				done()
			})
	})
	it("should serve the resized requested image", function (done) {
		var req = http.request(
			{ path: "/image/600/400?url=" + encodeURIComponent(sampleImage)
			, port: 8000
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
		req.end()
	})
	after(function () {
		handle.close()
	})
})