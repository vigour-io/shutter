var gm = require('gm')
	, config = require('./config')
	, cleanup = require('./cleanup')
	, imgManip = require('./imgManip')

module.exports = exports = function (dir, images, dimensions, cb) {
	createSprite(dir, images, dimensions, '.resized.' + config.spriteFormat, 'sprite', cb)
}