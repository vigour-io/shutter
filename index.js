var express = require('express')
	, http = require('http')
	, fs = require('fs')
	, bodyParser = require('body-parser')

	Cloud = require('vigour-js/browser/network/cloud')
    .inject(require('vigour-js/browser/network/cloud/datacloud'))
  , Data = require('vigour-js/data')

	, createSprite = require('./spriteMaker')
	, config = require('./config')
	, cleanup = require('./cleanup')

	, cloud = new Cloud('ws://' + config.cloudHost + ':' + config.cloudPort)
	, data = new Data(cloud.data.get(config.mtvCloudDataFieldName))

cloud.subscribe({
	mtvData: {
		regions: {
			'Netherlands': {
				'en': {
					shows: {
						$: {
							img: true
							, number: true
							, seasons: {
								$: {
									number: true
									, episodes: {
										$: {
											img: true
											, number: true
										}
									}
								}
							}
						}
					},
					channels: {
						$: {
							img: true
							, number: true
						}
					}
				}
			}
		}
	}
})

app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/:country/:lang/shows/:width/:height', function (req, res, next) {
	var p = req.params
	validateInput(req, res, next, [p.country, p.lang, 'shows'])
})

app.get('/:country/:lang/channels/:width/:height', function (req, res, next) {
	var p = req.params
	validateInput(req, res, next, [p.country, p.lang, 'channels'])
})

app.get('/:country/:lang/episodes/:showId/:seasonId/:width/:height', function (req, res, next) {
	var p = req.params
	validateInput(req, res, next, [p.country, p.lang, 'shows', p.showId, 'seasons', p.seasonId, 'episodes'])
})

app.get('*', function (req, res, next) {
	res.end(config.invalidRequestMessage)
})

data.addListener(function listen() {
	app.listen(config.port);
	console.log('Listening on port ', config.port);
	this.removeListener(listen)
})

function validateInput (req, res, next, path) {
	var items = dive(data.raw, path)
	if (items) {
		getSprite(req, res, next, items)
	} else {
		res.end(config.invalidRequestMessage)
	}
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

function getSprite (req, res, next, items) {
	var tempDirectory = config.tempDirectory + '/' + Math.random().toString().slice(1)
	fs.mkdir(tempDirectory, function (err) {
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
			errMessage = "Error creating temp directory " + tempDirectory + ": "
			console.log(errMessage, err)
			res.status(500).end(errMessage + err)
		} else {
			for (item in items) {
				ids[items[item].number - 1] = items[item].img
			}
			nbLeft = l = ids.length
			if (l === 0) {
				res.end(config.invalidRequestMessage)
			} else {
				for (i = 0; i < l; i += 1) {
					id = ids[i] || 'images/placeholder.jpg'
					url = urlFromId(id)
					path = tempDirectory + '/' + ids[i]
					paths.push(path)
					download(url, path, function (err) {
						if (err) {
							errMessage = "Error downloading " + url + ": "
							console.log(errMessage, err)
							res.status(500).end(errMessage + err)
							cleanup(tempDirectory)
						} else {
							nbLeft -= 1
							if (nbLeft === 0) {
								createSprite(tempDirectory
									, paths
									, {
										width: req.params.width
										, height: req.params.height
									}, function (err, spritePath) {
										if (err) {
											errMessage = "Error creating sprite: "
											console.log(errMessage, err)
											res.status(500).end(errMessage + err)
											cleanup(tempDirectory)
										} else {
											res.sendfile(spritePath)
											cleanup(tempDirectory)
										}
									})
							}
						}
					})
				}
			}
		}
	})
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