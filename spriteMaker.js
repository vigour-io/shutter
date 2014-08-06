var gm = require('gm')
	, config = require('./config')
	, cleanup = require('./cleanup')

module.exports = exports = function (images, dimensions, cb) {
	createSprite(images, dimensions, '.resized.' + config.spriteFormat, 'sprite', cb)
}

function createSprite (images, dimensions, resizedSuffix, name, cb) {
	var l = images.length
		, nbLeft = l
		, i
		, resizedImages = []
		, continueLoop = true

	for (i = 0; i < l && continueLoop; i += 1) {
		(function (iter) {
			gm(images[iter]).size(function (err, originalSize) {
				var wRatio
					, hRatio
					, resizeRatio
					, resizedName = images[iter] + resizedSuffix

				if (err) {
					console.log('Error: ', err)
					cb(err)
				} else {
					wRatio = dimensions.width / originalSize.width
					hRatio = dimensions.height / originalSize.height
					if (wRatio > hRatio) {
						resizeRatio = wRatio
					} else {
						resizeRatio = hRatio
					}

					resizedImages[iter] = resizedName
					gm(images[iter])
						.gravity('Center')
						.crop(dimensions.width / resizeRatio, dimensions.height / resizeRatio)
						.resize(dimensions.width, dimensions.height)
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
			})
		}(i))
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