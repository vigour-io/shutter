var path = require('path')
var fs = require('vigour-fs-promised')
var root = path.join(__dirname, '..')
var outPath = path.join(root, 'out')
var originalsPath = path.join(root, 'originals')

module.exports = exports = function (bool) {
  return fs.readdirAsync(outPath)
    .then(check)
    .then(function () {
      return fs.readdirAsync(originalsPath)
    })
    .then(check)

  function check (files) {
    var important = files.filter(function (item) {
      return item !== '.gitignore' && item !== '.DS_Store'
    })
    if (bool) {
      expect(important.length).to.be.gt(0)
    } else {
      expect(important.length).to.equal(0)
    }
  }
}
