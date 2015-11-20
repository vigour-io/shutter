'use strict'

var path = require('path')
var isEmpty = require('vigour-js/lib/util/is/empty')

module.exports = exports = Shutter

var Config = require('vigour-js/lib/config')

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
  this.config.tmpDir = {
    val: path.join(__dirname, '..', 'tmp')
  }
  this.config.outDir = {
    val: path.join(__dirname, '..', 'out')
  }
  this.config.originalsPath = {
    val: path.join(__dirname, '..', 'originals')
  }
  if (this.config.clean.val) {
    return this.clean()
  } else {
    this.config.separatorPrefix = { val: 'next:' }
    this.config.separatorSuffix = { val: ';content:' }
    this.config.separatorErrorSuffix = { val: ':error' }
  }
  if (!isEmpty(this.config.manip)) {
    return this.manip()
  } else {
    return this.serve()
  }
}

Shutter.prototype.clean = require('./clean')
Shutter.prototype.manip = require('./manip')
Shutter.prototype.serve = require('./serve')
