#!/usr/bin/env node
'use strict'

var Config = require('vigour-config')
var config = new Config()
var Service = require('../')

var service = new Service(config)
service.start()
