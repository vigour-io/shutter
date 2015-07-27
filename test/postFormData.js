var http = require('http')
  , path = require('path')
  , FormData = require('form-data')
  , fs = require('fs')
  , src = path.join(__dirname, 'imgs', 'canyon.jpg')
  , pic = new FormData()

pic.append('file', fs.createReadStream(src))

pic.submit('http://localhost:8000/image', function (err, res) {
  if (err) {
    console.error("FAIL", err)
  } else {
    console.log("statusCode", res.statusCode)
  }
})