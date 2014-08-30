var fs = require('vigour-fs')

	, imgManip = require('./imgManip')
	, util = require('./util')

	, config = require('./config')

module.exports = exports = {
	requestSprite: function (req, res, next) {
		var items = dive(data.raw, req.pathToSpriteData)
		if (items) {
			getSprite(req, res, items)
		} else {
			res.status(400).end(config.invalidRequestMessage)
		}
	}
}

function getSprite (req, res, items) {
	var tmpDir = config.tmpDir + '/' + Math.random().toString().slice(1)
		, desiredDimensions = {
			width: req.params.width
			, height: req.params.height
		}
	util.prepare(function (err) {
		if (err) {
			errMessage = "\nError creating temp directory " + config.tmpDir + ": "
			console.error(errMessage, err)
			res.status(500).end(errMessage + err)
		} else {
			fs.mkdir(tmpDir, function (err) {
				var ids = []
					, l
					, i
					, nbLeft
					, id
					, url
					, path
					, paths = []
					, errMessage
				if (err) {
					errMessage = "\nError creating temp directory " + tmpDir + ": "
					console.error(errMessage, err)
					res.status(500).end(errMessage + err)
				} else {
					for (item in items) {
						ids[items[item].number - 1] = items[item].img
					}
					nbLeft = l = ids.length
					if (l === 0) {
						res.status(400).end(config.invalidRequestMessage)
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
											console.error(errMessage, err)
											res.status(500).end(errMessage + err)
											util.cleanup(tmpDir)
										} else {
											nbLeft -= 1
											getSpriteIfReady(nbLeft
												, paths
												, desiredDimensions
												, tmpDir
												, res)
										}
									})
							} else {
								nbLeft -= 1
								getSpriteIfReady(nbLeft
									, paths
									, desiredDimensions
									, tmpDir
									, res)
							}
						}
					}
				}
			})
		}
	})
}

function getSpriteIfReady (nbLeft, paths, desiredDimensions, tmpDir, res) {
	if (nbLeft === 0) {
		imgManip.sprite(paths
			, desiredDimensions
			, tmpDir
			, config.spriteName
			, config.maxCols
			, function (err) {
				var errMessage
				if (err) {
					errMessage = "\nError creating sprite: "
					console.error(errMessage, err)
					res.status(500).end(errMessage + err)
					util.cleanup(tmpDir)
				} else {
					util.setHeaders(res)

					res.sendFile(tmpDir + '/' + config.spriteName + '.jpg'
						, {
							root: __dirname
							// , dotfiles: 'allow'
						}
						, function (err) {
							if (err) {
								console.error(err)
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