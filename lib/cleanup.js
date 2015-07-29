var rimraf = require('rimraf')

module.exports = exports = function (dir) {
	rimraf(dir, function (err) {
		if (err) {
			console.log("Can't remove directory " + dir)
		}
	})
}