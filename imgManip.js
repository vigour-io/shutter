var exec = require('child_process').exec
	, fs = require('fs')
	, config = require('./config')

	, cwd = process.cwd()
	, imConvertPath = process.env.IM_CONVERT_PATH

if (!imConvertPath) {
	throw "Please set environment variable IM_CONVERT_PATH to the location of ImageMagick's `convert`"
}

function execCommand (command, cb) {
	console.log('\nExecuting ', command)
	exec(command
		, { cwd: cwd }
		, cb)
}

module.exports = exports = {}

exports.effect = function (query, subject, dimensions, out, cb) {
	var effect = (query.effect) ? query.effect : 'smartResize'
	try {
		exports.effects[effect](subject, query, dimensions, out, cb)
	} catch (e) {
		e.message += ": " + config.invalidRequestMessage
		e.effect = effect
		cb(e)
	}
}

exports.effects = {}
exports.effects.smartResize = function (subject, ignored, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
	execCommand("gm convert '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0'"
		+ " '" + newOut + "'"
		, function (err) {
			cb(err, newOut)
		})
}
exports.effects.mask = function (subject, options, dimensions, out, cb) {
	exports.mask(subject
		, __dirname + '/images/' + options.mask + '.png'
		, '#' + options.fillColor
		, dimensions
		, out
		, cb)
}
exports.effects.tMask = function (subject, options, dimensions, out, cb) {
	exports.tMask(subject
		, __dirname + '/images/' + options.mask + '.png'
		, dimensions
		, out
		, cb)
}
exports.effects.overlay = function (subject, options, dimensions, out, cb) {
	exports.overlay(subject
		, __dirname + '/images/' + options.overlay + '.png'
		, dimensions
		, out
		, cb)
}
exports.effects.composite = function (subject, options, dimensions, out, cb) {
	exports.composite(subject
		, __dirname + '/images/' + options.overlay + '.png'
		, dimensions
		, out
		, cb)
}
exports.effects.blur = function (subject, options, dimensions, out, cb) {
	exports.blur(subject
		, options.radius
		, options.sigma
		, dimensions
		, out
		, cb)
}

exports.blur = function (subject, radius, sigma, dimensions, out, cb) {
	var newOut = out + '.jpg'
		, dimensionsString = dimensions.width + "x" + dimensions.height
	execCommand("gm convert '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0'"
		+ " -blur '" + radius + "x" + sigma + "'"
		+ " '" + newOut + "'"
		, function (err) {
			cb(err, newOut)
		})
}

exports.darken = function (subject, color, factor, out, cb) {
	var newOut = out + '.jpg'
	execCommand("gm convert '" + subject + "'"
		+ " -fill '" + color + "'"
		+ " -colorize '" + factor + "'"
		+ " '" + newOut + "'"
		, function (err) {
			cb(err, newOut)
		})
}
exports.mask = function (subject, mask, color, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
	execCommand(imConvertPath + " -size '" + dimensionsString + "'"
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
		+ " '" + newOut + "'"
		, function (err) {
			cb(err, newOut)
		})
}
exports.tMask = function (subject, mask, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.png'
	execCommand(imConvertPath
		+ " \\( '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0' \\)"
		+ " \\( '" + mask + "'"
		+ " -resize '" + dimensionsString + "'"
		+ " -gravity 'Center' \\)"
		+ " -compose 'CopyOpacity' -composite"
		+ " '" + newOut + "'"
		, function (err) {
			cb(err, newOut)
		})
}
exports.overlay = function (subject, overlay, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
	execCommand(imConvertPath
		+ " \\( '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0' \\)"
		+ " \\( '" + overlay + "'"
		+ " -resize '" + dimensionsString + "!' \\)"
		+ " -composite"
		+ " '" + newOut + "'"
		, function (err) {
			cb(err, newOut)
		})
}
exports.composite = function (subject, overlay, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.png'
	execCommand(imConvertPath
		+ " \\( '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0' \\)"
		+ " \\( '" + overlay + "'"
		+ " -resize '" + dimensionsString + "!'"
		+ " -gravity 'Center' \\)"
		+ " -compose 'CopyOpacity' -composite"
		+ " '" + newOut + "'"
		, function (err) {
			cb(err, newOut)
		})	
}
exports.sprite = function (images, dimensions, tmpDir, spriteName, maxCols, cb) {
	var l = images.length
		, nbLeft = Math.ceil(l / maxCols)
		, i
		, subSprites = []
		, stop = false
		, spritePath = tmpDir + '/' + spriteName + '.jpg'
		, subSpritePath
	if (l > maxCols) {
		for (i = 0; i < l && !stop; i += maxCols) {
			subSpritePath = tmpDir + '/' + spriteName + i + '.jpg'
			subSprites.push(subSpritePath)
			exports.subSprite(images.slice(i, i + maxCols)
				, dimensions
				, subSpritePath
				, function (err) {
					if (err) {
						stop = true
						cb(err)
					} else {
						nbLeft -= 1
						if (nbLeft === 0) {
							exports.assembleSprites(subSprites, spritePath, function (err) {
								cb(err, spritePath)
							})
						}
					}
				})
		}
	} else {
		exports.subSprite(images, dimensions, spritePath, function (err) {
			cb(err, spritePath)
		})
	}
}
exports.subSprite = function (images, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, imagesString = "'" + images.join("' '") + "'"
	execCommand("gm convert " + imagesString
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0'"
		+ " +append"
		+ " '" + out + "'"
		, cb)
}
exports.assembleSprites = function (images, out, cb) {
	var imagesString = "'" + images.join("' '") + "'"
	execCommand("gm convert " + imagesString
		+ " -append"
		+ " '" + out + "'"
		, cb)
}
