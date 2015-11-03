// var spriteMaker = require('./spriteMaker')

// function checkSpace () {
//   return new Promise(function (resolve, reject) {
//     // log.info("Checking disk space")
//     diskspace.check('/', function (err, total, free, status) {
//       var percent
//         , msg
//       if (err) {
//         log.error("Error checking disk space", err)
//         reject(err)
//       } else {
//         if (status !== 'READY') {
//           log.warn("Can't get disk space")
//           log.warn("status", status)
//           reject()
//         } else {
//           msg = "Free space left: " + free/total
//               + " \ 1 AKA ( " + Math.round(100*free/total) + "% )"
//           if (free/total < options.minFreeSpace) {
//             log.warn(msg)
//             log.info("Erasing all cached images")
//             resolve(Promise.all(
//               util.empty(options.originalsPath)
//               , util.empty(options.outDir)))
//           } else {
//             log.info(msg)
//             resolve()
//           }
//         }
//       }
//     })
//   })
// }

// function requestSprite (req, res, next) {
//  log.info('requesting sprite')
//  spriteMaker.requestSprite(req.pathToSpriteData
//    , data
//    , req.params
//    , req.tmpDir
//    , req.dimensions
//    , req.out
//    , function (err, spritePath, cb) {
//      if (err) {
//        err.pathToSpriteData = req.pathToSpriteData
//        err.params = err.params
//        log.error('spriteMaker.requestSprite error', err)
//        res.status(err.status).end(JSON.stringify(err, null, " "))
//      } else {
//        log.info("Serving sprite")
//        serve(res, spritePath, req.cacheForever, function (err) {
//          util.cleanup(req.tmpDir)
//        })
//      }
//    })
// }
