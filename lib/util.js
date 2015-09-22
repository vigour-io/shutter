var rimraf = require('rimraf')
  , log = require('npmlog')
  , Promise = require('promise')
  , fs = require('vigour-fs/lib/server')
  , readdir = Promise.denodeify(fs.readdir)
  , remove = Promise.denodeify(fs.remove)
  , path = require('path')

module.exports = exports = {}

exports.urlFromId = function (id) {
  return 'http://images.mtvnn.com/' + id + '/original'
}

exports.cleanup = function (dir) {
  rimraf(dir, function (err) {
    if (err) {
      log.error("Can't remove directory " + dir)
    }
  })
}

exports.empty = function (dir) {
  return readdir(dir)
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
          return remove(p)
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
      'Sun'
      , 'Mon'
      , 'Tue'
      , 'Wed'
      , 'Thu'
      , 'Fri'
      , 'Sat']
    , monthNames = [
      'Jan'
      , 'Feb'
      , 'Mar'
      , 'Apr'
      , 'May'
      , 'Jun'
      , 'Jul'
      , 'Aug'
      , 'Sep'
      , 'Oct'
      , 'Nov'
      , 'Dec'
    ]
    , date = new Date(timestamp)
    , pad = function (nb) {
      return (nb < 10) ? "0" + nb : nb
    }
  return dayNames[date.getUTCDay()]
    + ", "
    + date.getUTCDate()
    + " "
    + monthNames[date.getUTCMonth()]
    + " "
    + date.getUTCFullYear()
    + " "
    + pad(date.getUTCHours())
    + ":"
    + pad(date.getUTCMinutes())
    + ":"
    + pad(date.getUTCSeconds())
    + " "
    + "GMT"
}
