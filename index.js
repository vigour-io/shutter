var express = require('express')
	, bodyParser = require('body-parser')
	, log = require('npmlog')

	Cloud = require('vigour-js/browser/network/cloud')
    .inject(require('vigour-js/browser/network/cloud/datacloud'))
  , Data = require('vigour-js/data')
  , fs = require('vigour-fs')

  , spriteMaker = require('./spriteMaker')
  , imgManip = require('./imgManip')
  , util = require('./util')
  , HeaderMgr = require('./headerMgr')

	, config = require('./config')

	, headerMgr = new HeaderMgr()
	, cloud = new Cloud('ws://' + config.cloudHost + ':' + config.cloudPort)
	, data = new Data(cloud.data.get(config.mtvCloudDataFieldName))

	, subscribeObj = {}

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

cloud.on('error', function (err) {
	log.error('cloud error', err)
})

subscribeObj[config.mtvCloudDataFieldName] =  {
	// regions: {
		// $: {
		// 	$: {
		'Netherlands': { // Only use Netherlands until the cloud can support more
			$: {	// Only use en until the cloud can support more
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
}))

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
	headerMgr.setHeaders(res, path, cacheForever, function (err) {
		if (err) {
			log.error('Error setting headers', err)
			// TODO Warn dev team
		}
		res.sendFile(path
			, {
				root: __dirname
			}
			, function (err) {
				if (err) {
					log.error('Error sending file', err)
					// TODO Warn dev team
				}
				if (cb) {
					cb(err)	
				}
			})
	})
}

function makeOut (req, res, next) {
	try {
		req.out = config.outDir + '/' + encodeURIComponent(req.originalUrl)
		next()
	} catch (e) {
		invalidRequest(res)
	}
}

function invalidRequest (res) {
	res.status(400).end(config.invalidRequestMessage)
}

function prepare (req, res, next) {
	req.tmpDir = config.tmpDir + '/' + Math.random().toString().slice(1)
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

app.get('/image/:id/:width/:height'
	, cacheForever(true)
	, makeOut
	, serveCached
	, prepare
	, function (req, res, next) {
		var url = util.urlFromId(req.params.id)
			, path = req.tmpDir + '/' + 'original'
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
								serve(res, newPath, req.cacheForever, function (err) {
									util.cleanup(req.tmpDir)
								})
							}
						})
				}
			})
		})

app.get('/sprite/:country/:lang/shows/:width/:height'
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


data.addListener(function listen () {
	app.listen(config.port);
	console.log('Listening on port ', config.port);
	this.removeListener(listen)
})



function requestSprite (req, res, next) {
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
				serve(res, spritePath, req.cacheForever, function (err) {
					util.cleanup(req.tmpDir)
				})
			}
		})
}