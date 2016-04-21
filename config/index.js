'use strict'
var convict = require('convict')
var config = convict(require('./schema'))
var env = config.get('env')
var CONFIG_PATH = process.env.CONFIG_PATH

if (CONFIG_PATH) {
  // Load a custom configuration path.
  config.loadFile(CONFIG_PATH)
} else {
  // Load the environment-specific configuration path.
  config.load(require('./env/' + env))
}

config.validate()

module.exports = config.get()
