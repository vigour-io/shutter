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
	smartResize: function (subject, dimensions, out, cb) {
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
	, mask: function (subject, mask, color, dimensions, out, cb) {
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
	, transparentMask: function (subject, mask, dimensions, out, cb) {
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
	, compositeOverlay: function (subject, overlay, dimensions, out, cb) {
		var dimensionsString = dimensions.width + "x" + dimensions.height
		execCommand("/usr/local/opt/imagemagick/bin/convert"
			+ " \\( '" + subject + "'"
			+ " -resize '" + dimensionsString + "^'"
			+ " -gravity 'Center'"
			+ " -crop '" + dimensionsString + "+0+0' \\)"
			+ " \\( '" + overlay + "'"
			+ " -resize '" + dimensionsString + "!'"
			+ " -gravity 'Center' \\)"
			+ " -compose 'CopyOpacity' -composite"
			+ " '" + out + "'"
			, cb)	
	}
	, sprite: function (images, dimensions, out, cb) {
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
}
