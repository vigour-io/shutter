#!/usr/bin/env node
var pliant = require('pliant')
var start = require('../lib/launcher')
var config = require('../lib/config')

pliant.bin(config, start)
