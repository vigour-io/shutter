var config = module.exports = exports = {}

config.items =
	{ tmpDir:
		{ def: 'tmp' }
	, outDir:
		{ def: 'out' }
	, originalsPath:
		{ def: 'originals' }
	, maxCols:
		{ def: 10 }
	, maxTries:
		{ def: 6 }
	, invalidRequestMessage:
		{ def: "Invalid request. Make sure you are respecting the sprite maker api (https://github.com/vigour-io/vigour-img/blob/master/README.md#user-content-api) and that the requested data exists." }
	, port:
		{ def: 8000 }
	, maxWidth:
		{ def: 10000 }
	, maxHeight:
		{ def: 10000 }
	, minFreeSpace:
		{ def: 0.01 }
	}

config.files =
	{ def: null
	, env: "IMG_CONFIG"
	}