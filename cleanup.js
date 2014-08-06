var fs = require('fs')

module.exports = exports = function (files, basePath) {
	var l = files.length
		, i
	for (i = 0; i < l; i += 1) {
		fs.unlink(files[i], function (err) {
			if (err) {
				console.log("Can't remove file:", err)
			}
		})
	}
}