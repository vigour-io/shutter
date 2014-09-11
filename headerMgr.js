var fs = require('vigour-fs')

module.exports = exports = HeaderMgr

function HeaderMgr () {
  this.mtimes = {}
}

HeaderMgr.prototype.setHeaders = function (res, path, forever, cb) {
  var self = this
    , now = Date.now()
    , maxage = (forever) ? 31540000 : 0
    , mtime = self.mtimes[path]
  res.set("cache-control", "public, no-transform, max-age=" + maxage + ", s-maxage=" + maxage)
  res.set("expires", util.httpDate(now + maxage * 1000))
  if (mtime) {
    res.set("last-modified", mtime)  
    cb(null)
  } else {
    fs.stat(path, function (err, stats) {
      if (err) {
        cb(err.toString())
      } else {
        self.mtimes[path] = stats.mtime
        res.set("last-modified", stats.mtime)
        cb(null)
      }
    })
  }
}