'use strict'

var fs = require('vigour-fs-promised')

module.exports = exports = function (dir) {
  fs.removeAsync(dir)
    .catch((reason) => {
      console.log("Can't remove directory " + dir, reason)
    })
}
