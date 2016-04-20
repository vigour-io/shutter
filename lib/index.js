'use strict'

var path = require('path')
var fs = require('vigour-fs-promised')
// var isEmpty = require('vigour-js/lib/util/is/empty')

var _ = require('lodash')
var exec = require('child_process').execSync

module.exports = exports = Shutter

var appConfig = require('../config')

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
  this.config = _.cloneDeep(appConfig)
  if (config) {
    _.merge(this.config, config)
  }

  if (this.config.convertPath.length <= 1) {
    this.config.convertPath = findPath('convert')
  }
  if (this.config.identifyPath.length <= 1) {
    this.config.identifyPath = findPath('identify')
  }
}
Shutter.prototype.start = function () {
  _.merge(this.config, {
    tmpDir: path.join(process.cwd(), 'tmp'),
    outDir: path.join(process.cwd(), 'out'),
    originalsPath: path.join(process.cwd(), 'originals')
  })
  // console.log('this.config', this.config)
  if (this.config.clean) {
    return this.clean()
  } else {
    return fs.mkdirpAsync(this.config.tmpDir)
      .then(() => {
        return fs.mkdirpAsync(this.config.outDir)
      })
      .then(() => {
        return fs.mkdirpAsync(this.config.originalsPath)
      })
      .then(() => {
        _.merge(this.config, {
          separatorPrefix: 'next:',
          separatorSuffix: ';content:',
          separatorErrorSuffix: ':error'
        })

        if (this.config.manip && this.config.manip instanceof Array && this.config.manip.length > 0) {
          return this.manip()
        } else {
          _.merge(this.config, {
            server: {
              ip: '127.0.0.1'
            }
          })
          return this.serve()
        }
      })
  }
}

var findPath = function (command) {
  var path
  try {
    path = exec('which ' + command, {encoding: 'utf8'}).replace(/\n$/, '')
  } catch (e) {
    console.error('Path for:' + command + 'cannot be found, make sure you install it!')
  }
  return path || false
}

Shutter.prototype.clean = require('./clean')
Shutter.prototype.manip = require('./manip')
Shutter.prototype.serve = require('./serve')
