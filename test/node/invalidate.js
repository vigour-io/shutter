var Shutter = require('../../')
var awsInvalidate = require('../../lib/awsinvalidate')
var attempt = require('../attempt')
var expectCachedFiles = require('../expectCachedFiles')
var port = 8000
var host = 'localhost'

describe('Invalidate', function () {
  var handle
  before(function () {
    var shutter = new Shutter()
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
      '/image?width=20&height=20' + url
    ]
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
      })
      .then(function () {
        return expectCachedFiles(false)
      })
  })
})

function AwsRequestMock () {

}
function CloudFrontMock () {

}

var count = 0

CloudFrontMock.prototype.createInvalidation = function (params, cb) {
  count += 1
  expect(params.DistributionId).to.be.a.string
  expect(params.InvalidationBatch.CallerReference).to.be.a.string
  expect(params.InvalidationBatch.Paths.Quantity).to.be.a.number
  expect(params.InvalidationBatch.Paths.Items.length).to.equal(params.InvalidationBatch.Paths.Quantity)

  cb(null, {
    Location: 'https://console.aws.amazon.com/cloudfront/home?region=eu-central-1#distribution-settings:' + params.DistributionId,
    Invalidation: {
      Id: params.DistributionId,
      Status: 'Not complete',
      CreateTime: Date.now(),
      InvalidationBatch: {
        Paths: params.Paths,
        CallerReference: params.CallerReference
      }
    }
  })
  return new AwsRequestMock()
}

var awsMock = {
  CloudFront: CloudFrontMock
}

var config = {
  distributionId: 'SOMECRAZYID'
}

var paths = ['/apath', '/a/n/o/t/h/e/r%20path']

describe('CloudFront Invalidation', function () {
  it('should call the mock with correct parameters', function () {
    return awsInvalidate(awsMock, config, paths)
      .then(() => {
        expect(count).to.equal(1)
      })
  })
})
