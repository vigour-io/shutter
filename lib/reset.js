#!/usr/bin/env node
var Promise = require('promise')
	, fs = require('vigour-fs')
	, originalsPath = __dirname + '/../originals/'
	, outPath = __dirname + '/../out/'

fs.readdir(originalsPath, function (err, originalsFiles) {
	if (err) {
		console.error('Error reading directory', err)
	} else {
		fs.readdir(outPath, function (err, outFiles) {
			Promise.all(outFiles.filter(filterHidden)
					.map(function (val) {
						return remove(outPath + val)
					})
					.concat(originalsFiles.filter(filterHidden)
						.map(function (val) {
							return remove(originalsPath + val)
						}))
				)
				.then(function () {
					console.log("Done removing cached images")
				})	
		})
	}
})

function filterHidden (val) {
	return val.indexOf('.') !== 0
}


function remove (file) {
	return new Promise(function (resolve, reject) {
		console.log('Removing ', file)
		fs.remove(file, function (err) {
			if (err) {
				err.message += ": Error removing entry"
				err.entry = file
				reject(err)
			} else {
				resolve(file)
			}
		})
	})
}