var express = require('express')
	, bodyParser = require('body-parser')

	Cloud = require('vigour-js/browser/network/cloud')
    .inject(require('vigour-js/browser/network/cloud/datacloud'))
  , Data = require('vigour-js/data')

  , spriteMaker = require('./spriteMaker')

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