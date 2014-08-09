var express = require('express')
	, http = require('http')
	, bodyParser = require('body-parser')
	, fs = require('fs')


	Cloud = require('vigour-js/browser/network/cloud')
    .inject(require('vigour-js/browser/network/cloud/datacloud'))
  , Data = require('vigour-js/data')

	, config = require('./config')
	, imgManip = require('./imgManip')
	, cleanup = require('./cleanup')

	, cloud = new Cloud('ws://' + config.cloudHost + ':' + config.cloudPort)
	, data = new Data(cloud.data.get(config.mtvCloudDataFieldName))

	, subscribeObj = {}

subscribeObj[config.mtvCloudDataFieldName] =  {
	// regions: {
		// $: {
		// 	$: {
		'Netherlands': { // Only use Netherlands until the cloud can support more
			'en': {	// Only use en until the cloud can support more
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
	// }
}

cloud.subscribe(subscribeObj)

app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/sprite/:country/:lang/shows/:width/:height'
	, function (req, res, next) {
		var p = req.params
		requestSprite(req
			, res
			, next
			, [p.country
				, p.lang
				, 'shows'
			])
	})

// app.get('/sprite/:country/:lang/channels/:width/:height'
// 	, function (req, res, next) {
// 		var p = req.params
// 		requestSprite(req
// 			, res
// 			, next
// 			, [p.country
// 				, p.lang
// 				, 'channels'
// 			])
// 	})

app.get('/sprite/:country/:lang/episodes/:showId/:seasonId/:width/:height'
	, function (req, res, next) {
		var p = req.params
		requestSprite(req
			, res
			, next
			, [p.country
				, p.lang
				, 'shows'
				, p.showId
				, 'seasons'
				, p.seasonId
				, 'episodes'
			])
	})

app.get('*'
	, function (req, res, next) {
		res.status(400).end(config.invalidRequestMessage)
	})


data.addListener(function listen () {
	app.listen(config.port);
	console.log('Listening on port ', config.port);
	this.removeListener(listen)
})

function requestSprite (req, res, next, path) {
	var items = dive(data.raw, path)
	if (items) {
		getSprite(req, res, next, items)
	} else {
		res.status(400).end(config.invalidRequestMessage)
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
	var tmpDir = config.tmpDir + '/' + Math.random().toString().slice(1)
		, desiredDimensions = {
			width: req.params.width
			, height: req.params.height
		}
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
						path = 'images/placeholder.jpg'
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

function getSpriteIfReady (nbLeft, paths, desiredDimensions, tmpDir, res) {
	if (nbLeft === 0) {
		imgManip.makeSprite(paths
			, desiredDimensions
			, tmpDir
			, config.spriteName + '.' + config.spriteFormat
			, function (err, spritePath) {
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