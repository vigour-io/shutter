'use strict'

var path = require('path')
var fs = require('vigour-fs-promised')

module.exports = exports = function () {
  var self = this
  var paths = [
    this.config.originalsPath.val,
    this.config.outDir.val
  ]
  return paths.reduce(function (prev, curr, indx, arr) {
    return prev.then(function () {
      var glob = path.join(curr, '*')
      return fs.removeAsync(glob)
    })
  }, Promise.resolve())
    .then(function () {
      fs.readdirAsync(self.config.tmpDir.val)
        .then(function (files) {
          return files.reduce(function (prev, curr, indx, arr) {
            return prev.then(function () {
              if (curr.indexOf('.gitignore') === -1) {
                return fs.removeAsync(path.join(self.config.tmpDir.val, curr))
              }
            })
          }, Promise.resolve())
        })
    })
}
