var small = {
			width: 70
		, height: 45
	}
	, large = {
		width: 185
		, height: 105
	}

module.exports = exports = {
	small: {
		width: small.width
		, height: small.height
	}
	, large: {
		width: large.width
		, height: large.height
	}
	, retinaSmall: {
		width: small.width * 2
		, height: small.height * 2
	}
	, retinaLarge: {
		width: large.width * 2
		, height: large.height * 2
	}
	, spriteFormat: 'jpg'
	, invalidRequestMessage: "Invalid request. Make sure you are respecting the sprite maker api (https://github.com/vigour-io/vigour-spriteMaker/blob/master/README.md#user-content-api) and that the requested data exists."
}