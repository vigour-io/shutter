var fs = require('vigour-fs')

	, imgManip = require('./imgManip')
	, cleanup = require('./cleanup')
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
	prepare(function (err) {
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
								url = urlFromId(id)
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
											cleanup(tmpDir)
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

function prepare (cb) {
	fs.exists(config.tmpDir, function (exists) {	// Remove call to exists. Just call mkdir and ignore error due to directory already existing
		if (exists) {
			cb(null)
		} else {
			fs.mkdir(config.tmpDir, function (err) {
				if (err) {
					cb(err)
				} else {
					cb(null)
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
			, config.spriteFormat
			, config.maxCols
			, function (err) {
				var errMessage
				if (err) {
					errMessage = "\nError creating sprite: "
					console.error(errMessage, err)
					res.status(500).end(errMessage + err)
					cleanup(tmpDir)
				} else {
					res.set("Cache-Control", "public")
					res.set("Last-Modified", util.httpDate(Date.now()))
					res.set("Expires", util.httpDate(Date.now() + 10 * 60 * 1000))
					res.sendFile(tmpDir + '/' + config.spriteName + '.' + config.spriteFormat
						, {
							root: __dirname
							// , dotfiles: 'allow'
						}
						, function (err) {
							if (err) {
								console.error(err)
							}
							cleanup(tmpDir)
						})
				}
			})
	}
}

function urlFromId (id) {
	return 'http://images.mtvnn.com/' + id + '/original'
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