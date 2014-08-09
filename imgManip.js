var gm = require('gm')
	, exec = require('child_process').exec
	, fs = require('fs')

	, cwd = process.cwd()

function execCommand (command, cb) {
	console.log('\nExecuting ', command)
	exec(command
		, { cwd: cwd }
		, function (err) {
			cb(err)
		})
}

module.exports = exports = {
	resize: function (image, dimensions, destination, cb) {
		gm(image).size(function (err, originalSize) {
			var wRatio
				, hRatio
				, resizeRatio

			if (err) {
				console.log('Resize error')
				cb(err)
			} else {
				wRatio = dimensions.width / originalSize.width
				hRatio = dimensions.height / originalSize.height
				if (wRatio > hRatio) {
					resizeRatio = wRatio
				} else {
					resizeRatio = hRatio
				}

				gm(image)
					.gravity('Center')
					.crop(dimensions.width / resizeRatio, dimensions.height / resizeRatio)
					.resize(dimensions.width, dimensions.height)
					.write(destination, function (err) {
						cb(err, destination)
					})
			}
		})
	}
	, superimpose: function (subject, mask, destination, cb) {
	  var gmComposite = 'gm composite ' + mask + ' ' + subject + ' ' + destination
	  	, cwd = process.cwd()
	  exec(gmComposite
	  	, { cwd: cwd }
	  	, function (err) {
		    cb(err, destination)
		  })
	}
	, addMask: function (subject, mask, destination, dimensions, tmpDir, cb) {
		var resizedPrefix = 'resized.'
			, resizedSubject = tmpDir + '/' + resizedPrefix + subject
			, resizedMask = tmpDir + '/' + resizedPrefix + mask
		exports.resize(subject, dimensions, resizedSubject, function (err) {
			if (err) {
				console.error('Subject resize error')
				cb(err)
			} else {
				exports.resize(mask, dimensions, resizedMask, function (err) {
					if (err) {
						console.log('Mask resize error')
						cb(err)
					} else {
						exports.superimpose(resizedSubject, resizedMask, destination, cb)
					}
				})
			}
		})
	}
	, makeSprite: function (images, dimensions, tmpDir, destination, cb) {
		var l = images.length
			, nbLeft = l
			, i
			, resizedImages = []
			, continueLoop = true

		for (i = 0; i < l && continueLoop; i += 1) {
			(function (iter) {
				var resizedName = images[iter]
					+ '.resized'
				exports.resize(images[iter], dimensions, resizedName, function (err) {
					if (err) {
						console.error('Resizing error')
						cb(err)
					} else {
						resizedImages[iter] = resizedName
						nbLeft -= 1
						if (nbLeft === 0) {
							exports.buildSprite(resizedImages, destination, tmpDir, cb)
						}
					}
				})
			}(i))
		}
	}
	, buildSprite: function (images, destination, tmpDir, cb) {
		var sprite = gm(images[0])
			, l = images.length
			, i
			, horizontal = true
			, spritePath = tmpDir + '/' + destination
		for (i = 1; i < l; i += 1) {
			sprite.append(images[i], horizontal)
		}
		sprite.write(spritePath, function (err) {
			if (err) {
				console.log('Sprite build error')
				cb(err)
			} else {
				cb(null, spritePath)
			}
		})
	}
	, smartResize: function (subject, dimensions, out, cb) {
		var dimensionsString = dimensions.width + "x" + dimensions.height
		execCommand("gm convert '" + subject + "'"
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0'"
			+ " '" + out + "'"
			, cb)
	}
	, darken: function (subject, color, factor, out, cb) {
		execCommand("gm convert '" + subject + "'"
			+ " -fill '" + color + "'"
			+ " -colorize '" + factor + "'"
			+ " '" + out + "'"
			, cb)
	}
	, mask: function (subject, dimensions, mask, color, out, cb) {
		var dimensionsString = dimensions.width + "x" + dimensions.height
		execCommand("/usr/local/opt/imagemagick/bin/convert -size '" + dimensionsString + "'"
			+ " xc:'" + color + "'"
			+ " \\( "
				+ " \\( '" + subject + "'"
				+ " -resize '" + dimensionsString + "^'"
				+ " -gravity 'Center'"
				+ " -crop '" + dimensionsString + "+0+0' \\)"
				+ " \\( '" + mask + "'"
				+ " -resize '" + dimensionsString + "'"
				+ " -gravity 'Center' \\)"
				+ " -compose 'CopyOpacity' -composite"
			+ " \\)"
			+ " -gravity 'Center'"
			+ " -geometry '+0+0'"
			+ " -compose 'src-over'"
			+ " -composite "
			+ " '" + out + "'"
			, cb)
	}
	, transparentMask: function (subject, dimensions, mask, out, cb) {
		var dimensionsString = dimensions.width + "x" + dimensions.height
		execCommand("/usr/local/opt/imagemagick/bin/convert"
			+ " \\( '" + subject + "'"
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0' \\)"
			+ " \\( '" + mask + "'"
			+ " -resize '" + dimensionsString + "'"
			+ " -gravity 'Center' \\)"
			+ " -compose 'CopyOpacity' -composite"
			+ " '" + out + "'"
			, cb)
	}
	, overlay: function (subject, overlay, dimensions, out, cb) {
		var dimensionsString = dimensions.width + "x" + dimensions.height
		execCommand("/usr/local/opt/imagemagick/bin/convert"
			+ " \\( '" + subject + "'"
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0' \\)"
			+ " \\( '" + overlay + "'"
			+ " -resize '" + dimensionsString + "!' \\)"
			+ " -composite"
			+ " '" + out + "'"
			, cb)
	}
}
