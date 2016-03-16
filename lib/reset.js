#!/usr/bin/env node
'use strict'

var path = require('path')
var Promise = require('promise')
var fs = require('vigour-fs/lib/server')
var originalsPath = path.join(process.cwd(), 'originals')
var outPath = path.join(process.cwd(), 'out')

fs.readdir(originalsPath, function (err, originalsFiles) {
  if (err) {
    console.error('Error reading `originals` directory', err)
  } else {
    fs.readdir(outPath, function (err, outFiles) {
      if (err) {
        console.error('Error reading `out` directory', err)
      } else {
        Promise.all(outFiles.filter(filterHidden)
            .map(function (val) {
              return remove(path.join(outPath, val))
            })
            .concat(originalsFiles.filter(filterHidden)
              .map(function (val) {
                return remove(path.join(originalsPath, val))
              }))
          )
          .then(function () {
            console.log('Done removing cached images')
          })
      }
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
        err.message += ': Error removing entry'
        err.entry = file
        reject(err)
      } else {
        resolve(file)
      }
    })
  })
}
