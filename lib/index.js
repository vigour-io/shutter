'use strict'

var path = require('path')
var isEmpty = require('vigour-js/lib/util/is/empty')
var AWS = require('aws-sdk')

module.exports = exports = Shutter

var Config = require('vigour-config')

// TODO Find another solution for this (modifying Error.prototype is dirty)
Object.defineProperty(Error.prototype, 'toJSON', {
  value: function () {
    var alt = {}

    Object.getOwnPropertyNames(this).forEach(function (key) {
      alt[key] = this[key]
    }, this)

    return alt
  },
  configurable: true
})

function Shutter (config) {
  if (!(config instanceof Config)) {
    config = new Config(config)
  }
  this.config = config
}

Shutter.prototype.start = function () {
  this.config.set({
    tmpDir: {
      val: path.join(process.cwd(), 'tmp')
    },
    outDir: {
      val: path.join(process.cwd(), 'out')
    },
    originalsPath: {
      val: path.join(process.cwd(), 'originals')
    }
  })
  if (this.config.clean.val) {
    return this.clean()
  } else {
    this.config.set({
      separatorPrefix: {
        val: 'next:'
      },
      separatorSuffix: {
        val: ';content:'
      },
      separatorErrorSuffix: {
        val: ':error'
      }
    })
  }
  if (!isEmpty(this.config.manip)) {
    return this.manip()
  } else {
    AWS.config.apiVersions = {
      cloudfront: this.config.aws.cloudfront.apiVersion.val
    }
    AWS.config.update({
      accessKeyId: this.config.aws.accessKeyId.val,
      secretAccessKey: this.config.aws.secretAccessKey.val
    })
    this.config.set({
      properties: {
        AWS: true // prevents AWS from being transformed into an observable
      },
      AWS: AWS,
      IP: {
        val: '127.0.0.1'
      }
    })
    return this.serve()
  }
}

Shutter.prototype.clean = require('./clean')
Shutter.prototype.manip = require('./manip')
Shutter.prototype.serve = require('./serve')
