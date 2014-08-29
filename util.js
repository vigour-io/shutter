module.exports = exports = {}

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