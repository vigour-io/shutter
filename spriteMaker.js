var gm = require('gm')
	, config = require('./config.js')

module.exports = exports = function (images, version, cb) {	
	createSprite(images, config[version], '.resized.png', 'sprite', cb)
}

function createSprite (images, dimensions, resizedSuffix, name, cb) {
	var l = images.length
		, nbLeft = l
		, i
		, resizedImages = []
		, resizeOption = '!'

	for (i = 0; i < l; i += 1) {
		(function (iter) {
			gm(images[i]).size(function (err, originalSize) {
				var widthRatio
					, heightRatio
					, resizeConfig = {
						width: null
						, height: null
					}
					, resizedName = images[iter] + resizedSuffix
				if (err) {
					console.log('Error:', err)
				} else {
					widthRatio = dimensions.width / originalSize.width
					heightRatio = dimensions.height / originalSize.height

					if (widthRatio > heightRatio) {
						resizeConfig.width = dimensions.width
					} else {
						resizeConfig.height = dimensions.height
					}

					resizedImages[iter] = resizedName
					gm(images[iter])
						// .resize(resizeConfig.width, resizeConfig.height, resizeOption)
						.resize(dimensions.width, dimensions.height, resizeOption)
						.gravity('Center')
						.crop(dimensions.width, dimensions.height)
						.write(resizedName, function (err) {
							if (err) {
								console.log('Error:', err)
							} else {
								nbLeft -= 1
								if (nbLeft === 0) {
									buildSprite(resizedImages, name, cb)
								}
							}
						})
				}
			})
		}(i))
	}
}

function buildSprite (images, name, cb) {
	var sprite = gm(images[0])
		, l = images.length
		, i
		, ltr = true
	for (i = 1; i < l; i += 1) {
		sprite.append(images[i], ltr)
	}
	sprite.write(name + '.png', function (err) {
		if (err) {
			console.log('Error: ', err)
		} else {
			cb(name + '.png')
		}
	})
}