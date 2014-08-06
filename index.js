var express = require('express')
	, http = require('http')
	, fs = require('fs')
	, bodyParser = require('body-parser')
	, createSprite = require('./spriteMaker')
	, data = require('./data')
	, config = require('./config')
	, cleanup = require('./cleanup')
	, port = 8080

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

app.listen(port);
console.log('Listening on port ', port);

function validateInput (req, res, next, path) {
	var items = dive(data, path)
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
		if (err) {
			console.log("Can't create temp directory " + tempDirectory, err)
			res.status(500).end("Error creating temp directory " + tempDirectory, err)
		} else {
			for (item in items) {
				ids.push(items[item].img)
			}
			nbLeft = l = ids.length
			if (l === 0) {
				res.end(config.invalidRequestMessage)
			} else {
				for (i = 0; i < l; i += 1) {
					id = ids[i]
					url = urlFromId(id)
					path = tempDirectory + '/' + ids[i]
					paths.push(path)
					download(url, path, function (err) {
						if (err) {
							console.log("Can't download " + url, err)
							res.status(500).end("Error downloading " + url + ": " + err)
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
											console.log("Can't create sprite", err)
											res.status(500).end("Error creating sprite: " + err)
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