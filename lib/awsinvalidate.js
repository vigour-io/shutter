'use strict'

// var log = require('npmlog')

module.exports = exports = function (AWS, config, paths) {
  return new Promise(function (resolve, reject) {
    var cloudfront = new AWS.CloudFront()

    var params = {
      DistributionId: config.distributionId.val,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths
        }
      }
    }
    // log.info('calling AWS.CloudFront.createInvalidation', params)
    cloudfront.createInvalidation(params, function (err, data) {
      console.log("We're back!", err, data)
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
