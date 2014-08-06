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

// app.use(express.compress());
//max-age on 10min;
// app.use(express.static("" + __dirname + "/public", { maxAge: 21600000 }));
app.get('/:country/:lang/shows/:version', function (req, res, next) {
	var p = req.params
	validateInput(req, res, next, [p.country, p.lang, 'shows'])
})

// app.get('/:country/:lang/channels/:version', getChannelsSprite)

app.get('/:country/:lang/episodes/:showId/:seasonId/:version', function (req, res, next) {
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
	var ids = []
		, l
		, i
		, nbLeft
		, id
		, url
		, path
		, paths = []
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
			path = 'tmp/' + ids[i]
			paths.push(path)
			download(url, path, function (err) {
				if (err) {
					console.log("Can't download " + url, err)
					res.end(500)
					cleanup(paths)
				} else {
					nbLeft -= 1
					if (nbLeft === 0) {
						createSprite(paths, req.params.version, function (err, spritePath) {
							if (err) {
								console.log("Can't create sprite", err)
								res.end(500)
								cleanup(paths)
							} else {
								res.sendfile(spritePath)
								cleanup(paths)
							}
						})
					}
				}
			})
		}
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