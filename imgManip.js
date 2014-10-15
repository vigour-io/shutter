var exec = require('child_process').exec
	, fs = require('fs')
	, config = require('./config')
	, log = require('npmlog')
	, cwd = process.cwd()
	, imConvertPath = process.env.IM_CONVERT_PATH

if (!imConvertPath) {
	throw "Please set environment variable IM_CONVERT_PATH to the location of ImageMagick's `convert`. See README.md for more guidance."
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
		, error
	if (subject && dimensions && out && cb) {
		execCommand("gm convert '" + subject + "'"
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0'"
			+ " '" + newOut + "'"
			, function (err) {
				cb(err, newOut)
			})
	} else {
		error = new Error("Invalid request")
		error.fn = "smartResize"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}

exports.effects.smartResize2 = function (subject, ignored, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, error
	if (subject && dimensions && out && cb) {
		execCommand("gm convert '" + subject + "'"
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0'"
			+ " '" + out + "'"
			, function (err) {
				cb(err, out)
			})
	} else {
		error = new Error("Invalid request")
		error.fn = "smartResize2"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}

exports.effects.mask = function (subject, options, dimensions, out, cb) {
	var error
	if (options.mask && options.fillColor) {
		exports.mask(subject
			, __dirname + '/images/' + options.mask + '.png'
			, '#' + options.fillColor
			, dimensions
			, out
			, cb)
	} else {
		error = new Error("Invalid request")
		error.fn = "mask"
		error.details = "invalid options"
		error.parameters = {
			mask: options.mask || "MISSING"
			, fillColor: options.fillColor || "MISSING"
		}
		cb(error)
	}
}
exports.effects.tMask = function (subject, options, dimensions, out, cb) {
	var error
	if (options.mask) {
		exports.tMask(subject
			, __dirname + '/images/' + options.mask + '.png'
			, dimensions
			, out
			, cb)
	} else {
		error = new Error("Invalid request")
		error.fn = "tMask"
		error.details = "invalid options"
		error.parameters = {
			mask: options.mask || "MISSING"
		}
		cb(error)
	}
}
exports.effects.overlay = function (subject, options, dimensions, out, cb) {
	var error
	if (options.overlay) {
		exports.overlay(subject
			, __dirname + '/images/' + options.overlay + '.png'
			, dimensions
			, out
			, cb)
	} else {
		error = new Error("Invalid request")
		error.fn = "overlay"
		error.details = "invalid options"
		error.parameters = {
			overlay: options.overlay || "MISSING"
		}
		cb(error)
	}
}
exports.effects.composite = function (subject, options, dimensions, out, cb) {
	var error
	if (options.overlay) {
		exports.composite(subject
			, __dirname + '/images/' + options.overlay + '.png'
			, dimensions
			, out
			, cb)
	} else {
		error = new Error("Invalid request")
		error.fn = "composite"
		error.details = "invalid options"
		error.parameters = {
			overlay: options.overlay || "MISSING"
		}
		cb(error)
	}
}
exports.effects.blur = function (subject, options, dimensions, out, cb) {
	var error

	if (options.radius && options.sigma) {
		exports.blur(subject
			, options.radius
			, options.sigma
			, dimensions
			, out
			, cb)
	} else {
		error = new Error("Invalid request")
		error.fn = "blur"
		error.details = "invalid options"
		error.parameters = {
			radius: options.radius || "MISSING"
			, sigma: options.sigma || "MISSING"
		}
		cb(error)
	}
}
exports.effects.overlayBlur = function (subject, options, dimensions, out, cb) {
	var error
	if (options.overlay && options.radius && options.sigma) {
		exports.overlayBlur(subject
			, __dirname + '/images/' + options.overlay + '.png'
			, options.radius
			, options.sigma
			, dimensions
			, out
			, cb)
	} else {
		error = new Error("Invalid request")
		error.fn = "overlayBlur"
		error.details = "invalid options"
		error.parameters = {
			overlay: options.overlay || "MISSING"
			, radius: options.radius || "MISSING"
			, sigma: options.sigma || "MISSING"
		}
		cb(error)
	}
}

exports.overlayBlur = function (subject, overlay, radius, sigma, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
		, error
	if (subject && overlay && radius && sigma && dimensions && out && cb) {
		execCommand(imConvertPath
			+ " \\( '" + subject + "'"
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0'"
			+ " -blur '" + radius + "x" + sigma + "' \\)"
			+ " \\( '" + overlay + "'"
			+ " -resize '" + dimensionsString + "!' \\)"
			+ " -composite"
			+ " '" + newOut + "'"
			, function (err) {
				cb(err, newOut)
			})
	} else {
		error = new Error("Invalid request")
		error.fn = "overlayBlur"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, overlay: overlay || "MISSING"
			, radius: radius || "MISSING"
			, sigma: sigma || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}

exports.overlay = function (subject, overlay, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
		, error
	if (subject && overlay && dimensions && out && cb) {
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
	} else {
		error = new Error("Invalid request")
		error.fn = "overlay"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, overlay: overlay || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}

exports.blur = function (subject, radius, sigma, dimensions, out, cb) {
	var newOut = out + '.jpg'
		, dimensionsString = dimensions.width + "x" + dimensions.height
		, error
	if (subject && radius && sigma && dimensions && out && cb) {
		execCommand("gm convert '" + subject + "'"
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0'"
			+ " -blur '" + radius + "x" + sigma + "'"
			+ " '" + newOut + "'"
			, function (err) {
				cb(err, newOut)
			})
	} else {
		error = new Error("Invalid request")
		error.fn = "blur"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, radius: radius || "MISSING"
			, sigma: sigma || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}

exports.darken = function (subject, color, factor, out, cb) {
	var newOut = out + '.jpg'
		, error
	if (subject && color && factor && out && cb) {
		execCommand("gm convert '" + subject + "'"
			+ " -fill '" + color + "'"
			+ " -colorize '" + factor + "'"
			+ " '" + newOut + "'"
			, function (err) {
				cb(err, newOut)
			})
	} else {
		error = new Error("Invalid request")
		error.fn = "darken"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, color: color || "MISSING"
			, factor: factor || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}
exports.mask = function (subject, mask, color, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.jpg'
		, error
	if (subject && mask && color && dimensions && out && cb) {
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
	} else {
		error = new Error("Invalid request")
		error.fn = "mask"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, mask: mask || "MISSING"
			, color: color || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}
exports.tMask = function (subject, mask, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.png'
		, error
	if (subject && mask && dimensions && out && cb) {
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
	} else {
		error = new Error("Invalid request")
		error.fn = "tMask"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, mask: mask || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}

exports.composite = function (subject, overlay, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, newOut = out + '.png'
		, error
	if (subject && overlay && dimensions && out && cb) {
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
	} else {
		error = new Error("Invalid request")
		error.fn = "composite"
		error.details = "invalid parameters"
		error.parameters = {
			subject: subject || "MISSING"
			, overlay: overlay || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}
exports.sprite = function (images, dimensions, tmpDir, maxCols, out, cb) {
	var l
		, nbLeft
		, i
		, subSprites
		, stop
		, spritePath
		, subSpritePath
		, error
	if (images && dimensions && tmpDir && maxCols && cb) {
		l = images.length
		nbLeft = Math.ceil(l / maxCols)
		subSprites = []
		spritePath = out + '.jpg'
		if (l > maxCols) {
			for (i = 0; i < l; i += maxCols) {
				subSpritePath = tmpDir + '/' + i + '.jpg'
				subSprites.push(subSpritePath)
				exports.subSprite(images.slice(i, i + maxCols)
					, dimensions
					, subSpritePath
					, function (err) {
						if (err) {
							cb(err)
						} else {
							nbLeft -= 1
							if (nbLeft === 0) {
								exports.assembleSprites(subSprites, spritePath, cb)
							}
						}
					})
			}
		} else {
			exports.subSprite(images, dimensions, spritePath, cb)
		}
	} else {
		error = new Error("Invalid request")
		error.fn = "sprite"
		error.details = "invalid parameters"
		error.parameters = {
			images: images || "MISSING"
			, dimensions: dimensions || "MISSING"
			, tmpDir: tmpDir || "MISSING"
			, maxCols: maxCols || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}
exports.subSprite = function (images, dimensions, out, cb) {
	var dimensionsString = dimensions.width + "x" + dimensions.height
		, imagesString = "'" + images.join("' '") + "'"
		, error
	if (images && dimensions && out && cb) {
		execCommand("gm convert " + imagesString
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0'"
			+ " +append"
			+ " '" + out + "'"
			, function (err) {
				cb(err, out)
			})
	} else {
		error = new Error("Invalid request")
		error.fn = "subSprite"
		error.details = "invalid parameters"
		error.parameters = {
			images: images || "MISSING"
			, dimensions: dimensions || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}
exports.assembleSprites = function (images, out, cb) {
	var imagesString = "'" + images.join("' '") + "'"
		, error
	if (images && out && cb) {
		execCommand("gm convert " + imagesString
			+ " -append"
			+ " '" + out + "'"
			, function (err) {
				cb(err, out)
			})
	} else {
		error = new Error("Invalid request")
		error.fn = "assembleSprites"
		error.details = "invalid parameters"
		error.parameters = {
			images: images || "MISSING"
			, out: out || "MISSING"
			, cb: cb || "MISSING"
		}
		cb(error)
	}
}
