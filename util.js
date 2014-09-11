var rimraf = require('rimraf')
  , log = require('npmlog')

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