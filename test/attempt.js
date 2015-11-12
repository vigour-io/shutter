var http = require('http')

module.exports = exports = function (fullPath, port, host) {
  return function () {
    return new Promise(function (resolve, reject) {
      var reqOptions =
        { path: fullPath,
          port: port,
          hostname: host
        }
      // console.log("reqOptions", reqOptions)
      var req = http.request(reqOptions
      , function (res) {
        var total = ''
        res.on('error', reject)
        res.on('data', function (chunk) {
          total += chunk
        })
        res.on('end', function () {
          if (res.statusCode !== 200) {
            var str = total.toString()
            console.log('RESULT', (str === '[object Object]')
              ? JSON.stringify(str)
              : str)
          }
          expect(res.statusCode).to.equal(200)
          resolve()
        })
      })
      req.on('error', reject)
      req.end()
    })
    .catch(function (reason) {
      console.error('An error occured', reason)
    })
  }
}
