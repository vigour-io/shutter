var express = require('express')
	, http = require('http')
	, fs = require('fs')
	, bodyParser = require('body-parser')
	, createSprite = require('./spriteMaker')
	, data = require('./data')
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
	getSprite(req, res, next, data[p.country][p.lang]['shows'])
})

// app.get('/:country/:lang/channels/:version', getChannelsSprite)

app.get('/:country/:lang/episodes/:showId/:seasonId/:version', function (req, res, next) {
	var p = req.params
	getSprite(req, res, next, data[p.country][p.lang]['shows'][p.showId]['seasons'][p.seasonId]['episodes'])
})

app.listen(port);
console.log('Listening on port ', port);

function getSprite (req, res, next, items) {
	var ids = []
		, l
		, i
		, nbLeft
		, id
		, path
		, paths = []
	for (item in items) {
		ids.push(items[item].img)
	}
	nbLeft = l = ids.length
	for (i = 0; i < l; i += 1) {
		id = ids[i]
		path = 'tmp/' + ids[i]
		paths.push(path)
		download(urlFromId(id), path, function (err) {
			if (err) {
				console.log('Error:', err)
			} else {
				nbLeft -= 1
				if (nbLeft === 0) {
					createSprite(paths, req.params.version, function (spritePath) {
						res.sendfile(spritePath)
					})
				}
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