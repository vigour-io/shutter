var rimraf = require('rimraf')

module.exports = exports = {}

exports.urlFromId = function (id) {
  return 'http://images.mtvnn.com/' + id + '/original'
}

exports.cleanup = function (dir) {
  rimraf(dir, function (err) {
    if (err) {
      console.log("Can't remove directory " + dir)
    }
  })
}

exports.prepare = function (cb) {
  fs.exists(config.tmpDir, function (exists) {  // Remove call to exists. Just call mkdir and ignore error due to directory already existing
    if (exists) {
      cb(null)
    } else {
      fs.mkdir(config.tmpDir, function (err) {
        if (err) {
          cb(err)
        } else {
          cb(null)
        }
      })
    }
  })
}

exports.setHeaders = function (res) {
  res.set("Cache-Control", "public")
  res.set("Last-Modified", util.httpDate(Date.now()))
  res.set("Expires", util.httpDate(Date.now() + 10 * 60 * 1000))
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