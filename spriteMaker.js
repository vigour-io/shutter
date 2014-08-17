var fs = require('fs')
	, http = require('http')

	, imgManip = require('./imgManip')
	, cleanup = require('./cleanup')

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
			errMessage = "Error creating temp directory " + config.tmpDir + ": "
			console.log(errMessage, err)
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
					errMessage = "Error creating temp directory " + tmpDir + ": "
					console.log(errMessage, err)
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
								download(url, path, function (err) {
									if (err) {
										errMessage = "Error downloading " + url + ": "
										console.log(errMessage, err)
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
	fs.exists(config.tmpDir, function (exists) {
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
	var spritePath
	if (nbLeft === 0) {
		spritePath = config.spriteName + '.' + config.spriteFormat
		imgManip.sprite(paths
			, desiredDimensions
			, spritePath
			, function (err) {
				var errMessage
				if (err) {
					errMessage = "Error creating sprite: "
					console.log(errMessage, err)
					res.status(500).end(errMessage + err)
					cleanup(tmpDir)
				} else {
					res.sendfile(spritePath)
					cleanup(tmpDir)
				}
			})
	}
}

function urlFromId (id) {
	return 'http://images.mtvnn.com/' + id + '/306x172'
}

function download (url, dest, cb) {
	var file = fs.createWriteStream(dest)
		, request = http.get(url, function (response) {
			response.pipe(file)
			file.on('finish', function () {
				file.close(cb)
			})
		}).on('error', function (err) {
			fs.unlink(dest)
			cb(err.message)
		})
}

function dive (obj, path) {
	var r = obj
		, l = path.length
		, i
	for (i = 0; i < l; i += 1) {
		r = r[path[i]]
		if (!r) {
			console.log(path[i] + ' not found')
			return false
		}
	}
	return r
}