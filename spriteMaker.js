var fs = require('vigour-fs')

	, imgManip = require('./imgManip')
	, util = require('./util')

	, config = require('./config')

module.exports = exports = {}
exports.requestSprite = function (pathToSpriteData, data, params, tmpDir, dimensions, out, cb) {
	var items = dive(data.raw, pathToSpriteData)
	if (items) {
		getSprite(items, params, tmpDir, dimensions, out, cb)
	} else {
		cb({
			status: 400
			, msg: config.invalidRequestMessage
		})
	}
}

function getSprite (items, params, tmpDir, dimensions, out, cb) {
	var ids = []
		, l
		, i
		, nbLeft
		, id
		, url
		, path
		, paths = []
		, errMessage
	for (item in items) {
		ids[items[item].number - 1] = items[item].img
	}
	nbLeft = l = ids.length
	if (l === 0) {
		cb({
			status: 400
			, msg: config.invalidRequestMessage
		})
	} else {
		for (i = 0; i < l; i += 1) {
			if (ids[i]) {
				id = ids[i]
				url = util.urlFromId(id)
				path = tmpDir + '/' + ids[i]
			} else {
				url = false
				path = 'images/mtv_logo_placeholder.png'
			}
			paths.push(path)
			if (url) {
				fs.writeFile(path, url, {
						maxTries: config.maxTries
				    , retryOn404: true	// MTV sometimes responds with 404 even when retries work
					}
					, function (err) {
						if (err) {
							errMessage = "\nDownload error (" + url + "). "
							log.error(errMessage, err)
							cb({
								status: 500
								, msg: errMessage + err
							})
							util.cleanup(tmpDir)
						} else {
							nbLeft -= 1
							getSpriteIfReady(nbLeft
								, paths
								, dimensions
								, tmpDir
								, out
								, cb)
						}
					})
			} else {
				nbLeft -= 1
				getSpriteIfReady(nbLeft
					, paths
					, dimensions
					, tmpDir
					, out
					, cb)
			}
		}
	}
}

function getSpriteIfReady (nbLeft, paths, dimensions, tmpDir, out, cb) {
	if (nbLeft === 0) {
		imgManip.sprite(paths
			, dimensions
			, tmpDir
			, config.maxCols
			, out
			, function (err, spriteName) {
				var errMessage
				if (err) {
					errMessage = "\nError creating sprite: "
					log.error(errMessage, err)
					cb({
						status: 500
						, msg: errMessage + err
					})
					util.cleanup(tmpDir)
				} else {
					cb(null, spriteName, function (err) {
						if (err) {
							log.error(err)
						}
						util.cleanup(tmpDir)
					})
				}
			})
	}
}

function dive (obj, path) {
	var r = obj
		, l = path.length
		, i
	for (i = 0; i < l; i += 1) {
		r = r[path[i]]
		if (!r) {
			console.error(path[i] + ' not found')
			return false
		}
	}
	return r
}