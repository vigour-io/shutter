'use strict'

var log = require('npmlog')
var Promise = require('promise')
var fs = require('vigour-fs-promised')
var path = require('path')

module.exports = exports = {}

exports.urlFromId = function (id) {
  return 'http://images.mtvnn.com/' + id + '/original'
}

exports.cleanup = function (dir) {
  fs.removeAsync(dir)
    .catch((reason) => {
      log.error("Can't remove directory " + dir, reason)
    })
}

exports.empty = function (dir) {
  return fs.readdirAsync(dir)
    .catch(function (reason) {
      log.error("Can't read directory")
      throw reason
    })
    .then(function (files) {
      var toErase = files.filter(function (item) {
        return item !== '.gitignore'
      })
      return Promise.all(
        toErase.map(function (item) {
          var p = path.join(dir
            , item)
          return fs.removeAsynd(p)
            .catch(function (reason) {
              log.error("Can't remove item", p)
              throw (reason)
            })
        })
      )
    })
}

exports.httpDate = function (timestamp) {
  var dayNames = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
  ]
  var monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]
  var date = new Date(timestamp)
  var pad = function (nb) {
    return (nb < 10) ? '0' + nb : nb
  }
  return dayNames[date.getUTCDay()] +
    ', ' +
    date.getUTCDate() +
    ' ' +
    monthNames[date.getUTCMonth()] +
    ' ' +
    date.getUTCFullYear() +
    ' ' +
    pad(date.getUTCHours()) +
    ':' +
    pad(date.getUTCMinutes()) +
    ':' +
    pad(date.getUTCSeconds()) +
    ' ' +
    'GMT'
}
