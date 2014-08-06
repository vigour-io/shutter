var gm = require('gm')
	, config = require('./config')
	, cleanup = require('./cleanup')

module.exports = exports = function (images, version, cb) {
	if (config[version] && config[version].width && config[version].height) {
		createSprite(images, config[version], '.resized.' + config.spriteFormat, 'sprite', cb)
	} else {
		cb("Invalid sprite version identifier. Check the sprite maker api (https://github.com/vigour-io/vigour-spriteMaker/blob/master/README.md#user-content-api) for a list of valid sprite version identifiers.")
	}
}

function createSprite (images, dimensions, resizedSuffix, name, cb) {
	var l = images.length
		, nbLeft = l
		, i
		, resizedImages = []
		, resizedName

	for (i = 0; i < l; i += 1) {
		resizedName = images[i] + resizedSuffix
		resizedImages[i] = resizedName
		gm(images[i])
			.resize(dimensions.width, dimensions.height, '!')
			.gravity('Center')
			.crop(dimensions.width, dimensions.height)
			.write(resizedName, function (err) {
				if (err) {
					console.log('Error:', err)
					cb(err)
					cleanup(resizedImages)
				} else {
					nbLeft -= 1
					if (nbLeft === 0) {
						buildSprite(resizedImages, name, cb)
					}
				}
			})
	}
}

function buildSprite (images, name, cb) {
	var sprite = gm(images[0])
		, l = images.length
		, i
		, horizontal = true
	for (i = 1; i < l; i += 1) {
		sprite.append(images[i], horizontal)
	}
	sprite.write(name + '.' + config.spriteFormat, function (err) {
		if (err) {
			console.log('Error: ', err)
			cb(err)
			cleanup(images)
		} else {
			cb(null, name + '.' + config.spriteFormat)
			cleanup(images)
		}
	})
}