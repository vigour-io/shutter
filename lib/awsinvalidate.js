'use strict'

// var log = require('npmlog')
var AWS = require('aws-sdk')

module.exports = exports = function (config, paths) {
  return new Promise(function (resolve, reject) {
    console.log('config', config)
    // var cloudfront = new AWS.CloudFront({
    //   apiVersion: config.cloudfront.apiVersion,
    //   accessKeyId: config.accessKeyId,
    //   secretAccessKey: config.secretAccessKey
    // })
    var cloudfront = new AWS.CloudFront({
      apiVersion: config.cloudfront.apiVersion,
      credentials: new AWS.Credentials(config.accessKeyId, config.secretAccessKey)
    })

    var params = {
      DistributionId: config.cloudfront.distributionId,
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
      // console.log("We're back!", err, data)
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
