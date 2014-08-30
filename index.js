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

	, config = require('./config')

	, cloud = new Cloud('ws://' + config.cloudHost + ':' + config.cloudPort)
	, data = new Data(cloud.data.get(config.mtvCloudDataFieldName))

	, subscribeObj = {}

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
}));

app.get('/image/:id/:width/:height/:effect?'
	, function (req, res, next) {
		var tmpDir = config.tmpDir + '/' + Math.random().toString().slice(1)
			, out = config.outDir + '/' + util.escapeSlashes(req.originalUrl)
			, desiredDimensions = {
				width: req.params.width
				, height: req.params.height
			}
			, url = util.urlFromId(req.params.id)
			, path = tmpDir + '/' + 'original'
		util.prepare(function (err) {
			if (err) {
				err.message += ": Error creating temp dir"
				err.path = config.tmpDir
				res.status(500).end(err.toString())
			} else {
				fs.mkdir(tmpDir, function (err) {
					if (err) {
						err.message += ": Error creating temp directory"
						err.path = tmpDir
						res.status(500).end(err)
					} else {
						fs.exists(config.outDir, function (exists) {
							if (exists) {
								finish()
							} else {
								fs.mkdir(config.outDir, function (err) {
									if (err) {
										err.message += ": Error creating output directory"
										err.path = config.outDir
										res.status(500).end(err.toString())
									} else {
										finish()
									}
								})
							}
						})
					}
				})
			}
		})
	function finish () {
		fs.writeFile(path
			, url
			, {
				maxTries: config.maxTries
				, retryOn404: true
			}
			, function (err) {
				if (err) {
					err.message += ': Download error'
					err.url = url
					res.status(500).end(err.toString())
					util.cleanup(tmpDir)
				} else {
					imgManip.effect(req.params.effect
						, path
						, desiredDimensions
						, out
						, function (err, newPath) {
							if (err) {
								err.message += ": Error creating image"
								err.path = path
								res.status(500).end(err.toString())
								util.cleanup(tmpDir)
							} else {
								util.setHeaders(res)
								res.sendFile(newPath
									, {
										root: __dirname
									}
									, function (err) {
										if (err) {
											err.message += ": Error sending file"
											log.error(err)
										}
										util.cleanup(tmpDir)
									})
							}
						})
				}
			})
		}
	})

app.get('/sprite/:country/:lang/shows/:width/:height'
	, function (req, res, next) {
		var p = req.params
		req.pathToSpriteData = [p.country
			, p.lang
			, 'shows'
		]
		next()
	}
	, spriteMaker.requestSprite)

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
	, spriteMaker.requestSprite)

app.get('*'
	, function (req, res, next) {
		res.status(400).end(config.invalidRequestMessage)
	})


data.addListener(function listen () {
	app.listen(config.port);
	console.log('Listening on port ', config.port);
	this.removeListener(listen)
})
