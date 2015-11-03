'use strict'

module.exports = exports = setHeaders

function setHeaders (res, forever) {
  var maxage = (forever) ? 31540000 : 0
  res.set("cache-control", "public, no-transform, max-age=" + maxage)
  res.set("Edge-Control", "!no-cache, max-age=" + maxage)
}
