var path = require('path')
var version = require('../package.json').version
var config = module.exports = exports = {}

config.version = version

config.items =
	{ tmpDir:
		{ def: path.join(__dirname, '..', 'tmp') }
	, outDir:
		{ def: path.join(__dirname, '..', 'out') }
	, originalsPath:
		{ def: path.join(__dirname, '..', 'originals') }
	, maxCols:
		{ def: 10 }
	, maxTries:
		{ def: 6 }
	, invalidRequestMessage:
		{ def: "Invalid request. Make sure you are respecting the sprite maker api (https://github.com/vigour-io/vigour-img/blob/master/README.md#user-content-api) and that the requested data exists." }
	, port:
		{ def: 8000
		, env: "IMG_PORT"
		, cli: "-p, --port <nb>"
		, desc: "Port on which the server should listen"
		}
	, maxWidth:
		{ def: 10000 }
	, maxHeight:
		{ def: 10000 }
	, minFreeSpace:
		{ def: 0.01 }
	, convertPath:
		{ def: "/usr/bin/convert"
		, env: "IMG_CONVERT_PATH"
		, cli: "--img-convert-path <path>"
		, desc: "Path to Image Magick's `convert` executable"
		}
	, clean:
		{ def: false
		, cli: "-x, --clean"
		, desc: "Removes all downloaded originals, produced images and temporary folders and files, then exits"
		}
	}

config.files =
	{ def: null
	, env: "IMG_CONFIG"
	}