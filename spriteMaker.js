var gm = require('gm')
	, config = require('./config')
	, cleanup = require('./cleanup')

module.exports = exports = function (dir, images, dimensions, cb) {
	createSprite(dir, images, dimensions, '.resized.' + config.spriteFormat, 'sprite', cb)
}

function createSprite (dir, images, dimensions, resizedSuffix, name, cb) {
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
								cleanup(dir)
							} else {
								nbLeft -= 1
								if (nbLeft === 0) {
									buildSprite(dir, resizedImages, name, cb)
								}
							}
						})
				}
			})
		}(i))
	}
}

function buildSprite (dir, images, name, cb) {
	var sprite = gm(images[0])
		, l = images.length
		, i
		, horizontal = true
		, spritePath = dir + '/' + name + '.' + config.spriteFormat
	for (i = 1; i < l; i += 1) {
		sprite.append(images[i], horizontal)
	}
	sprite.write(spritePath, function (err) {
		if (err) {
			console.log('Error: ', err)
			cb(err)
			cleanup(dir)
		} else {
			cb(null, spritePath)
			cleanup(dir)
		}
	})
}