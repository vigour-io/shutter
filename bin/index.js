#!/usr/bin/env node
var pliant = require('pliant')
var start = require('../launcher')
var config = require('../config')

module.exports = exports = pliant.bin(start, config)