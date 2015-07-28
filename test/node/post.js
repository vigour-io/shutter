var http = require('http'),
    path = require('path'),
    fs = require('fs'),
    src = path.join(__dirname, 'imgs', 'canyon.jpg'),
    width = 900,
    height = 600,
    options = {
        port: 8000,
        path: '/image',
        method: 'POST',
        headers: {
            "Content-Type": "image/jpeg"
        }
    }

fs.stat(src, function(err, stats) {
    options.headers["Content-Length"] = stats.size
    var req = http.request(options, function(res) {
        console.log("statusCode", res.statusCode)
        res.on('error', function(err) {
            console.error("RES FAIL", err)
        })
        res.on('data', function(chunk) {
            console.log('Response: ' + chunk);
        })
        res.on('end', function() {
            console.log('DONE')
        })
    })
    req.on('error', function(err) {
        console.error("REQ FAIL", err)
    })
    fs.createReadStream(src).pipe(req).on('end', function() {
        req.end()
    })
})