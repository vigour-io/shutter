var path = require('path')
var FormData = require('form-data')
var imgServer = require('../../')
var fs = require('vigour-fs')
var sampleImage = path.join(__dirname, '..', 'data', 'sample.jpg')
var handle

describe("Form POST /image/:width/:height", function () {
	before(function (done) {
		this.timeout(5000)
		imgServer()
			.then(function (_handle) {
				handle = _handle
				done()
			})
	})
	it("should serve a resized version of the posted image", function (done) {
		var pic = new FormData()
		pic.append('file', fs.createReadStream(sampleImage))
		pic.submit('http://localhost:8000/image/600/400', function (err, res) {
			expect(err).not.to.exist
	    expect(res.statusCode).to.equal(200)
	    done()
		})
	})
	after(function (done) {
		handle.close(function () {
			done()
		})
	})
})