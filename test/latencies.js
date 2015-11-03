'use strict'

var http = require('http')
  , Promise = require('promise')
  , options = {
    port: 8000
  }
  , delay = 10
  , attemptNb = 0
  , allResults = []
  , interval
  , duration = 10000
  , timeout

function randomRequest (options) {
  options.path = randomSrc()
  console.log('options', options)
  return new Promise(function (resolve, reject) {
    var req = http.request(options, function (res) {
        res.on('error', function (e) {
          reject(e)
        })
        res.on('data', function (chunk) {
          // console.log("Response data", chunk)
        })
        res.on('end', function () {
          var endTime = Date.now()
          resolve({
            startTime: startTime
            , endTime: endTime
          })
        })
      })
      , startTime = Date.now()

    req.on('error', function (e) {
      reject(e)
    })
    req.end()
  })
}

function randomSrc () {
    var imgId = imgIds[Math.floor(Math.random() * imgIds.length)]
        , w = Math.floor(Math.random() * 1000) + 1
        , h = Math.floor(Math.random() * 1000) + 1
        , query = randomQuery()
    return 'http://localhost/image/' + imgId + '/' + w + '/' + h + query
}

function randomQuery () {
    var effect = randomEffect()
        , key
        , value
        , str = ""
        , first = true
    for (key in effect) {
        value = effect[key]
        str += (first) ? "?" : "&"
        first = false
        str += key + "="
        if (typeof value === 'string') {
            str += value
        } else if (typeof value === 'function') {
            str += value()
        } else {
            throw new TypeError("Found a non-string non-function.")
        }
    }
    return str
}

function randomEffect () {
    var effects = [
            {
                effect: 'inexistant'
            }
            , {
                effect: 'tMask'
                , mask: randomMask
            }
            , {
                effect: 'composite'
                , overlay: randomMask
            }
            , {
                effect: 'mask'
                , mask: randomMask
                , fillColor: randomColor
            }
            , {
                effect: 'overlay'
                , overlay: randomMask
            }
            , {
                effect: 'smartResize'
            }
            , {
                effect: 'blur'
                , radius: randomRadius
                , sigma: randomSigma
            }
            , {
                effect: 'overlayBlur'
                , overlay: randomMask
                , radius: randomRadius
                , sigma: randomSigma
            }
        ]
        , l = effects.length
    return effects[Math.floor(Math.random() * l)]
}

function randomColor () {
    var letters = '0123456789ABCDEFG'.split('')
        , l = letters.length
        , color = ''
        , i
    for (i = 0; i < 6; i += 1) {
        color += letters[Math.floor(Math.random() * l)]
    }
    return color
}

function randomMask () {
    var masks = [
            'inexistant'
            , 'avatarMask'
            , 'logoMask'
            , 'mtv_logo_placeholder'
            , 'overlay'
            , 'overlayDarkpurple'
            , 'overlayDarkpurple2'
            , 'overlayDarkpurple3'
            , 'overlayFixed'
            , 'overlayLight'
            , 'overlayMid'
            , 'overlayPurple'
            , 'overlayTv'
            , 'overlay_lightest'
        ]
        , l = masks.length

    return masks[Math.floor(Math.random() * l)]
}

function randomRadius () {
    return Math.floor(Math.random() * 6)
}

function randomSigma () {
    return Math.floor(Math.random() * 8) + 1
}

process.on('uncaughtException', function (err) {
  console.warn("uncaught exception", err)
  process.exit()
})

process.on('SIGINT', function() {
  console.log("\n")
  process.exit()
})

process.on('exit', function (code) {
  var l = allResults.length
    , i
    , latency
    , max = 0
    , min = false
    , acc = 0
    , avg
  clearInterval(interval)
  for (i = 0; i < l; i += 1) {
    latency = allResults[i].endTime - allResults[i].startTime
    acc += latency
    if (min === false) {
      min = latency
    }
    if (latency < min) {
      min = latency
    }
    if (latency > max) {
      max = latency
    }
  }
  avg = acc / l
  console.log("results", allResults)
  console.log("Duration", duration, "ms")
  console.log("Delay between attempts", "~", delay, "ms")
  console.log("Number of attempts", l)
  console.log("Minimum latency", min, "ms")
  console.log("Average latency", avg, "ms")
  console.log("Maximum latency", max, "ms")
})

interval = setInterval(function () {
  var nb = ++attemptNb
  randomRequest(options)
    .then(function (results) {
      allResults.push(results)
    })
}, delay)

timeout = setTimeout(function () {
  clearInterval(interval)
}, duration)

var imgIds = ["inexistant"
  , "98b704d32caf5a819eb7c749fa20cd26"
  , "93df2f1e49306cb8bd6459db085c32332"
  , "a4be779ce540ce9b07968ef477d66f050"
  , "bd57a02545a15716fcb014269566ba2f1"
  , "7fdffd3525d88c002bd19efe3f729664"
  , "c827bbcd254b71fbbddb79c99d9b83a50"
  , "3f6ecb3e516c64246ca65f3472b938ef0"
  , "4b1708611713f36100da9bd13798904e4"
  , "c45a7e78dd8a3b51e4a416737f131a6c2"
  , "67b00bd4d6e131dc7663a0796eb4d5b62"
  , "e8da32014c6e47c1433ffa074c48e5993"
  , "f4b0c465ab019f7c9f8be6827ceaa2e81"
  , "c89b6426dd2a066940a1325aadb692220"
  , "67bfbda4624f2a1220a8f64ac70b01031"
  , "cee6d31b15b74c631a480cc1afa4b8980"
  , "b689dae58d749bb16c0dcd41885ddef40"
  , "7108a128700da7b29ec4e595f0f2f9600"
  , "e39002a56c08da8bae27afd8816a52634"
  , "e9854b3fafec512e63007840dbb38aa10"
  , "8ff6dd981bc6af1035ebf85cf58625d73"
  , "01fbcb3919ff8b1ed1b2b50d8dcd90191"
  , "b1390e9904d4dfd6ae09ce5c00e008d32"
  , "4d8a457a65de8b3b74a7d60a31d497613"
  , "7900f63d1fd2f4b114b6f99dbca337b73"
  , "05b314bc2637d4591ced50b9723329862"
  , "9aa9c1e8ff463a001372f0de7b4a13292"
  , "d03531ccb40960180a52fe65a79b94df2"
  , "4d9510409e85e99a99b6fd9bb6492c0f4"
  , "503ec04d830c42886c8d981e6f9a43a63"
  , "8296b3813aa9f71dc7824f4351c146fb3"
  , "ea05f24bdffd2f10b1f954499eebd3b42"
  , "5900e8768dd093cab6cd1917cc08152e1"
  , "048976327460f9874916717017efb6514"
  , "f5d221eeedf9539bbb4c6b8fb89e4dbc1"
  , "b02315cce40309771f2417a89aed404e0"
  , "966ebce5980cbb2cfa45c131b3453fee4"
  , "e3a36c7a9da5f3c89b2172f905824c423"
  , "44dfc671ebdd8ff714046a00bb004fdb2"
  , "ea1305824e89214a5cd850f0dde4090e3"
  , "094c524e2d01f6c8f004c893c13297921"
  , "5f4876827ae6491c1f016ccaf14e585c4"
  , "5c56726ca2217c34f050905254c93fba2"
  , "4a5e871275fe3c0ee51e34ed8e74a4123"
  , "d5a00f38fe09c0c70867f81df72ce287"
  , "e52d31ca64fcdad91beed22a99f8d714"
  , "0682cd16c5247464b7fd55d3bd553e06"
  , "e8aeaa6ba25b2e86148b0946fce73fdc"
  , "1ece230e29eabc4836d7531d1a6dcf9d"
  , "06b7dbaa0493e7ed9117e1efa319d38d"
  , "04528d3d4a4e8e51d99a16b796b3327a"
  , "0722f88e8457a49b7bf29d8dd99ce9480"
  , "ef098d4c2b3895678f820a0f213ae7ab0"
  , "dcab50002012501b391ff2a1d4f343d80"
  , "9e5d7854a27dd05609fecd3575a51dd90"
  , "9585f614858d249a522e4a3a665bdb190"
  , "5334a5efcf136fe307ce9a7385e44cf00"
  , "8bef5967bb3b0aadf3ed4e442d7f23b90"
  , "b6e76ac9d04a53fe30dbb8594e5e982b0"
  , "74ccbfe2da557fa605cb344bc35819900"
  , "06966da3b500b0af26e074f702e3ee8f0"
  , "3b864678a50e3edf510c9e4613e7cd600"
  , "d6b93b2a3878e6120eca1ab8320f29b40"
  , "738301b029e1dee69a249af1bff2857e0"
  , "610c52a9b1d55f53a9f7f05253b4ff720"
  , "525411c377559a8a6eb9851bfa8886170"
  , "222e7cf1055de1d428f370bb7b0b13950"
  , "e01285527c8214ac63865bcc3197d43c0"
  , "342638bc5bd8d0fd7fa24489931b6ec30"
  , "2181e68e5dd83a8bcc5de4144fc5bcb40"
  , "9061ff653667bdfa90bbd1872d9d1ab50"
  , "708e50177facd6947fec376e1213a9650"
  , "9a1c65cec740f4798b0806b3e5b5f22b0"
  , "5c91e356a3d6b475896062b7a9b06aec0"
  , "bdff4e6aadf27cac2c2dc8f34938a9960"
  , "8e32158507fb4e8c7e70c284d367ca860"
  , "27810f47a0d8917cb22b67bbf2e97f7a0"
  , "dece75f2a55c2064de462d76711fe11c0"
  , "cd5e92fbf35dba4cf39b60788afc5e370"
  , "42fd2e97dac89876b8c005681a92a3030"
  , "68d771bc113e4f4f40773e6a7b5c62100"
  , "b12468a25f363f3c0b424c6619045cd80"
  , "734bf22d0ee50b8236f75d5896857fd0"
  , "84dc21c01bdb2b9a335176088e79747a2"
  , "909f0e54a80480cd9bcb5d9cc9b66c250"
  , "793a0db8417d78f5b9693c95315b976f3"
  , "bcb24db116d8e9b0b37abc6dca542b5e3"
  , "92e55b9a2bc2d2c0d014b6a48c78131b1"
  , "a78eb4452c29fc636759a360651f6ccf3"
  , "849bfaf03e0681f52f7b1c4526ebf5300"
  , "9e6d07e10f86b86f73052513b9c98dd61"
  , "f71424f96c865d1b9738e77c0575dcda2"
  , "b10b27d4ed8aedbcd495d384f3ec53b93"
  , "921871d3857922ab16b407c30a7a5e473"
  , "ea35fc8bdbcf9554ac5989da81f804af1"
  , "e1f7939ac8eab5ca2602b6fa5c89877f1"
  , "dcbbdc18d3f27bbe74953984078ea95a2"
  , "efdebb013add1fde6f5bc532a23bda360"
  , "7e0c35f3790fb1b6655645da135aa0623"
  , "3121f3fbbd5fdfc4d581fa162667c7eb0"
  , "b5dd8af16a9b6281c548d166b7dabe2a1"]
