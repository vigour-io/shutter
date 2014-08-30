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

module.exports = exports = {}

exports.effect = function (effect, subject, dimensions, out, cb) {
	if (!effect) {
		effect = 'smartResize'
	}
	try {
		exports[effect](subject, dimensions, out, cb)
	} catch (e) {
		e.message += ": " + config.invalidRequestMessage
		e.effect = effect
		cb(e)
	}
}

exports.avatar = function (subject, dimensions, out, cb) {
	exports.transparentMask(subject
		, __dirname + '/images/avatar_mask.png'
		, dimensions
		, out
		, cb)
}








exports.smartResize = function (subject, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
	execCommand("gm convert '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0'"
		+ " '" + newOut + "'"
		, function () {
			cb(null, newOut)
		})
}
exports.darken = function (subject, color, factor, out, cb) {
	var newOut = out + '.jpg'
	execCommand("gm convert '" + subject + "'"
		+ " -fill '" + color + "'"
		+ " -colorize '" + factor + "'"
		+ " '" + newOut + "'"
		, function () {
			cb(null, newOut)
		})
}
exports.mask = function (subject, mask, color, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
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
		+ " '" + newOut + "'"
		, function () {
			cb(null, newOut)
		})
}
exports.transparentMask = function (subject, mask, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.png'
	execCommand("/usr/local/opt/imagemagick/bin/convert"
		+ " \\( '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0' \\)"
		+ " \\( '" + mask + "'"
		+ " -resize '" + dimensionsString + "'"
		+ " -gravity 'Center' \\)"
		+ " -compose 'CopyOpacity' -composite"
		+ " '" + newOut + "'"
		, function () {
			cb(null, newOut)
		})
}
exports.overlay = function (subject, overlay, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
	execCommand("/usr/local/opt/imagemagick/bin/convert"
		+ " \\( '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0' \\)"
		+ " \\( '" + overlay + "'"
		+ " -resize '" + dimensionsString + "!' \\)"
		+ " -composite"
		+ " '" + newOut + "'"
		, function () {
			cb(null, newOut)
		})
}
exports.compositeOverlay = function (subject, overlay, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.png'
	execCommand("/usr/local/opt/imagemagick/bin/convert"
		+ " \\( '" + subject + "'"
		+ " -resize '" + dimensionsString + "^'"
		+ " -gravity 'Center'"
		+ " -crop '" + dimensionsString + "+0+0' \\)"
		+ " \\( '" + overlay + "'"
		+ " -resize '" + dimensionsString + "!'"
		+ " -gravity 'Center' \\)"
		+ " -compose 'CopyOpacity' -composite"
		+ " '" + newOut + "'"
		, function () {
			cb(null, newOut)
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
							exports.assembleSprites(subSprites, spritePath, function () {
								cb(null, spritePath)
							})
						}
					}
				})
		}
	} else {
		exports.subSprite(images, dimensions, spritePath, function () {
			cb(null, spritePath)
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
