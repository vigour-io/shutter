var express = require('express')
	, bodyParser = require('body-parser')
	, expressValidator = require('express-validator')
	, log = require('npmlog')

	, Cloud = require('vigour-js/browser/network/cloud')
    .inject(require('vigour-js/browser/network/cloud/datacloud'))
  , Data = require('vigour-js/data')
  , fs = require('vigour-fs')

  , spriteMaker = require('./spriteMaker')
  , imgManip = require('./imgManip')
  , util = require('./util')
  , setHeaders = require('./setHeaders')

	, config = require('./config')

	, cloud = new Cloud('ws://' + config.cloudHost + ':' + config.cloudPort)
	, data = new Data(cloud.data.get(config.mtvCloudDataFieldName))

	, subscribeObj = {}

console.log('starting')

Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
        var alt = {}

        Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key]
        }, this)

        return alt
    },
    configurable: true
})

app = express();

app.use(function (req, res, next) {
	console.log(req.method, req.originalUrl)
	next()
})

app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(expressValidator())

app.get('/image/:id/:width/:height'
	, validateDimensions
	, validateImgId
	, validateEffects
	, cacheForever(true)
	, makeOut
	, serveCached
	, prepare
	, function (req, res, next) {
		var url = util.urlFromId(req.params.id)
			, path = req.tmpDir + '/' + 'original'
		console.log("Downloading original image")
		fs.writeFile(path
			, url
			, {
				maxTries: config.maxTries
				, retryOn404: true	// MTV's image server sometimes returns 404 even if image does exists, i.e. retrying may work
			}
			, function (err) {
				if (err) {
					err.details = 'vigour-fs.write (download) error'
					err.path = path
					err.data = url
					log.error(err.details, err)
					res.status(500).end(JSON.stringify(err, null, " "))
					util.cleanup(req.tmpDir)
				} else {
					console.log("Transforming image")
					imgManip.effect(req.query
						, path
						, req.dimensions
						, req.out
						, function (err, newPath) {
							if (err) {
								err.details = "imgManip.effect error"
								err.query = req.query
								err.path = path
								err.dimensions = req.dimensions
								err.out = req.out
								res.status(500).end(JSON.stringify(err, null, " "))
								util.cleanup(req.tmpDir)
							} else {
								console.log("Serving image")
								serve(res, newPath, req.cacheForever, function (err) {
									util.cleanup(req.tmpDir)
								})
							}
						})
				}
			})
		})

app.get('/sprite/:country/:lang/shows/:width/:height'
	, validateDimensions
	, cacheForever(false)
	, makeOut
	, serveCached
	, prepare
	, function (req, res, next) {
		var p = req.params
		req.pathToSpriteData = [p.country
			, p.lang
			, 'shows'
		]
		next()
	}
	, requestSprite)

app.get('/sprite/:country/:lang/episodes/:showId/:seasonId/:width/:height'
	, validateDimensions
	, cacheForever(false)
	, makeOut
	, serveCached
	, prepare
	, function (req, res, next) {
		var p = req.params
		req.pathToSpriteData = [p.country
			, p.lang
			, 'shows'
			, p.showId
			, 'seasons'
			, p.seasonId
			, 'episodes'
		]
		next()
	}
	, requestSprite)

app.get('*'
	, function (req, res, next) {
		invalidRequest(res)
	})

cloud.on('welcome', function (err) {
	console.log('cloud welcome')
})

cloud.on('error', function (err) {
	log.error('cloud error', err)
})

subscribeObj[config.mtvCloudDataFieldName] =  {
	$: {
		$: {
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

cloud.subscribe(subscribeObj)

data.addListener(listen)

function listen () {
	console.log("Listen called")
	app.listen(config.port);
	console.log('Listening on port ', config.port);
	this.removeListener(listen)
}

function serveCached (req, res, next) {
	var filePath = req.out + '.jpg'
	serveIfExists(filePath
		, req.cacheForever
		, res
		, function (err) {
			if (err) {
				filePath = req.out + '.png'
				serveIfExists(filePath
					, req.cachedForever
					, res
					, function (err) {
						if (err) {
							next()
						}
					})
			}
		})
}

function serveIfExists (path, cacheForever, res, cb) {
	fs.exists(path, function (exists) {
		if (exists) {
			console.log('Serving existing file')
			serve(res, path, cacheForever)
			cb(null)
		} else {
			cb(true)
		}
	})
}

function cacheForever (bool) {
	return function (req, res, next) {
		req.cacheForever = bool
		next()
	}
}

function serve (res, path, cacheForever, cb) {
	setHeaders(res, cacheForever)
	res.sendFile(path
		, {
			root: __dirname
		}
		, function (err) {
			if (err) {
				log.error('Error sending file', err)
				// TODO Warn dev team
			} else {
				console.log("sendFile succeeds", path)
			}
			if (cb) {
				cb(err)	
			}
		})
}

function makeOut (req, res, next) {
	console.log('making out')
	try {
		req.out = config.outDir + '/' + encodeURIComponent(req.originalUrl)
		next()
	} catch (e) {
		invalidRequest(res)
	}
}

function invalidRequest (res) {
	console.log('Serving 400')
	res.status(400).end(config.invalidRequestMessage)
}

function prepare (req, res, next) {
	req.tmpDir = config.tmpDir + '/' + Math.random().toString().slice(1)
	console.log('creating temp directory')
	fs.mkdir(req.tmpDir, function (err) {
		if (err) {
			err.detail = 'fs.mkdir error'
			err.path = req.tmpDir
			res.status(500).end(JSON.stringify(err, null, " "))
		} else {
			req.dimensions = {
				width: req.params.width
				, height: req.params.height
			}
			next()		
		}
	})	
}

function validateEffects (req, res, next) {
	var errors
		, validEffects = [
			'composite'
			, 'mask'
			, 'overlay'
			, 'tMask'
			, 'blur'
			, 'overlayBlur'
			, 'smartResize'
		]
		, fileNameRE = /^[a-zA-Z][\w\.-]*$/
	console.log('validating effects')
	if (req.query.effect) {
		req.checkQuery('effect', 'effect should be a valid effect').isIn(validEffects)
		if (!errors) {
			if (~['mask', 'tMask'].indexOf(req.query.effect)) {
				req.checkQuery('mask', "mask should be a valid file name, without the extension").matches(fileNameRE)
				if (req.query.effect === 'mask') {
					req.checkQuery('fillColor', "fillColor should be a valid hexadecimal color").isHexColor()
					req.sanitize('fillColor').blacklist('#')
				}
			} else if (~['overlayBlur', 'overlay', 'composite'].indexOf(req.query.effect)) {
				req.checkQuery('overlay', '').matches(fileNameRE)
			}
			if (~['overlayBlur', 'blur'].indexOf(req.query.effect)) {
				req.checkQuery('radius', "radius should be an integer").isInt()
				req.checkQuery('sigma', "sigma should be an integer").isInt()
			}
		}
	}
	errors = req.validationErrors()
	if (errors) {
		res.status(400).end(config.invalidRequestMessage + '\n' + JSON.stringify(errors))
	} else {
		next()
	}
}

function validateImgId (req, res, next) {
	var errors
	console.log('validating image id')
	req.checkParams('id', "id should be alphanumeric").isAlphanumeric()
	errors = req.validationErrors()
	if (errors) {
		res.status(400).end(config.invalidRequestMessage + '\n' + JSON.stringify(errors))
	} else {
		next()
	}
}

function validateDimensions (req, res, next) {
	var errors
	console.log('validating dimensions')
	req.checkParams('width', 'width should be an integer').isInt()
	req.checkParams('height', 'height should be an integer').isInt()
	errors = req.validationErrors()
	if (errors) {
		res.status(400).end(config.invalidRequestMessage + '\n' + JSON.stringify(errors))
	} else {
		next()
	}
}

function requestSprite (req, res, next) {
	console.log('requesting sprite')
	spriteMaker.requestSprite(req.pathToSpriteData
		, data
		, req.params
		, req.tmpDir
		, req.dimensions
		, req.out
		, function (err, spritePath, cb) {
			if (err) {
				err.pathToSpriteData = req.pathToSpriteData
				err.params = err.params
				log.error('spriteMaker.requestSprite error', err)
				res.status(err.status).end(JSON.stringify(err, null, " "))
			} else {
				console.log("Serving sprite")
				serve(res, spritePath, req.cacheForever, function (err) {
					util.cleanup(req.tmpDir)
				})
			}
		})
}