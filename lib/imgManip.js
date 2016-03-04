'use strict'

var spawn = require('child_process').spawn
var vspawn = require('vigour-spawn')
var path = require('path')
var Promise = require('promise')
var cwd = process.cwd()
var opts
var pids = {}
var limits = [
  '-limit Area 134217728',
  '-limit Disk 10gb',
  '-limit Map 128',
  '-limit time 7',
  '-limit thread 2'
].join(' ')
module.exports = exports = {}

exports.init = function (_options) {
  opts = _options
}

exports.computeDimensions = function (subject, dimensions) {
  return vspawn(opts.identifyPath.val + ' ' + limits + ' -format %wx%h ' + subject, { getOutput: true })
    .then((str) => {
      var parts = str.split('x')
      var w = parseInt(parts[0], 10)
      var h = parseInt(parts[1], 10)
      if (!dimensions.width && !dimensions.height) {
        dimensions.width = w
        dimensions.height = h
      } else {
        var ratio = w / h
        if (!dimensions.width) {
          dimensions.width = '' + Math.round(ratio * parseInt(dimensions.height, 10))
        }
        if (!dimensions.height) {
          dimensions.height = '' + Math.round(parseInt(dimensions.width, 10) / ratio)
        }
      }

      return dimensions
    })
}

exports.effect = function (query, subject, dimensions, out) {
  var prom = Promise.resolve()
  if (!dimensions.width || !dimensions.height) {
    prom = prom.then(() => {
      return exports.computeDimensions(subject, dimensions)
    })
  } else {
    prom = prom.then(() => {
      return dimensions
    })
  }
  prom = prom.then((targetDimensions) => {
    return new Promise(function (resolve, reject) {
      var effect = (query.effect) ? query.effect : 'smartResize'
      if (opts.verbose.val) {
        console.log('query', query)
      }
      if (!query.outType && query.url && query.url.slice(-4).toLowerCase() === '.png' && ['mask', 'blur', 'overlayBlur'].indexOf(effect) === -1) {
        query.outType = 'png'
      }
      var format = (query.outType)
        ? ' -format ' + query.outType.toUpperCase()
        : ''
      try {
        resolve(exports.effects[effect](subject, query, targetDimensions, format, out))
      } catch (e) {
        e.message += ': ' + opts.invalidRequestMessage.val
        e.effect = effect
        reject(e)
      }
    })
  })
  return prom
}

exports.effects = {}

exports.effects.smartResize = function (subject, options, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var dimensionsString = dimensions.width + 'x' + dimensions.height
    var newOut = out + '.' + ((options.outType) ? options.outType : 'jpg')
    var error
    if (subject && dimensions && out) {
      execCommand(opts.convertPath.val + ' ' + limits + ' ' + subject +
        ' -resize ' + dimensionsString + '^' +
        ' -gravity Center' +
        ' -crop ' + dimensionsString + '+0+0' +
        format +
        ' ' + newOut
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(newOut)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'smartResize'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        dimensions: dimensions || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}

exports.effects.smartResize2 = function (subject, options, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var dimensionsString = dimensions.width + 'x' + dimensions.height
    var error
    if (subject && dimensions && out) {
      execCommand(opts.convertPath.val + ' ' + limits + ' ' + subject +
        ' -resize ' + dimensionsString + '^' +
        ' -gravity Center' +
        ' -crop ' + dimensionsString + '+0+0' +
        format +
        ' ' + out
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(out)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'smartResize2'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        dimensions: dimensions || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}

exports.effects.mask = function (subject, options, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var error
    if (options.mask && options.fillColor) {
      resolve(exports.mask(subject
        , path.join(__dirname, '..', 'images', options.mask + '.png')
        , '#' + options.fillColor
        , dimensions
        , format
        , out + '.' + ((options.outType) ? options.outType : 'jpg')))
    } else {
      error = new Error('Invalid request')
      error.fn = 'mask'
      error.details = 'invalid options'
      error.parameters = {
        mask: options.mask || 'MISSING',
        fillColor: options.fillColor || 'MISSING'
      }
      reject(error)
    }
  })
}
exports.effects.tMask = function (subject, options, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var error
    if (options.mask) {
      resolve(exports.tMask(subject
        , path.join(__dirname, '..', 'images', options.mask + '.png')
        , dimensions
        , format
        , out + '.' + ((options.outType) ? options.outType : 'png')))
    } else {
      error = new Error('Invalid request')
      error.fn = 'tMask'
      error.details = 'invalid options'
      error.parameters = {
        mask: options.mask || 'MISSING'
      }
      reject(error)
    }
  })
}
exports.effects.overlay = function (subject, options, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var error
    if (options.overlay) {
      resolve(exports.overlay(subject
        , path.join(__dirname, '..', 'images', options.overlay + '.png')
        , dimensions
        , format
        , out + '.' + ((options.outType) ? options.outType : 'jpg')))
    } else {
      error = new Error('Invalid request')
      error.fn = 'overlay'
      error.details = 'invalid options'
      error.parameters = {
        overlay: options.overlay || 'MISSING'
      }
      reject(error)
    }
  })
}
exports.effects.composite = function (subject, options, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var error
    if (options.overlay) {
      resolve(exports.composite(subject
        , path.join(__dirname, '..', 'images', options.overlay + '.png')
        , dimensions
        , format
        , out + '.' + ((options.outType) ? options.outType : 'png')))
    } else {
      error = new Error('Invalid request')
      error.fn = 'composite'
      error.details = 'invalid options'
      error.parameters = {
        overlay: options.overlay || 'MISSING'
      }
      reject(error)
    }
  })
}
exports.effects.blur = function (subject, options, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var error

    if (options.radius && options.sigma) {
      resolve(exports.blur(subject
        , options.radius
        , options.sigma
        , dimensions
        , format
        , out + '.' + ((options.outType) ? options.outType : 'jpg')))
    } else {
      error = new Error('Invalid request')
      error.fn = 'blur'
      error.details = 'invalid options'
      error.parameters = {
        radius: options.radius || 'MISSING',
        sigma: options.sigma || 'MISSING'
      }
      reject(error)
    }
  })
}
exports.effects.overlayBlur = function (subject, options, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var error
    if (options.overlay && options.radius && options.sigma) {
      resolve(exports.overlayBlur(subject,
        path.join(__dirname, '..', 'images', options.overlay + '.png'),
        options.radius,
        options.sigma,
        dimensions,
        format,
        out + '.' + ((options.outType) ? options.outType : 'jpg')))
    } else {
      error = new Error('Invalid request')
      error.fn = 'overlayBlur'
      error.details = 'invalid options'
      error.parameters = {
        overlay: options.overlay || 'MISSING',
        radius: options.radius || 'MISSING',
        sigma: options.sigma || 'MISSING'
      }
      reject(error)
    }
  })
}

exports.overlayBlur = function (subject, overlay, radius, sigma, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var dimensionsString = dimensions.width + 'x' + dimensions.height
    var error
    if (subject && overlay && radius && sigma && dimensions && out) {
      execCommand(opts.convertPath.val + ' ' + limits +
        ' ( ' + subject +
        ' -resize ' + dimensionsString + '^' +
        ' -gravity Center' +
        ' -crop ' + dimensionsString + '+0+0' +
        ' -blur ' + radius + 'x' + sigma + ' )' +
        ' ( ' + overlay +
        ' -resize ' + dimensionsString + '! )' +
        ' -composite' +
        format +
        ' ' + out
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(out)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'overlayBlur'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        overlay: overlay || 'MISSING',
        radius: radius || 'MISSING',
        sigma: sigma || 'MISSING',
        dimensions: dimensions || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}

exports.overlay = function (subject, overlay, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var dimensionsString = dimensions.width + 'x' + dimensions.height
    var error
    if (subject && overlay && dimensions && out) {
      execCommand(opts.convertPath.val + ' ' + limits +
        ' ( ' + subject +
        ' -resize ' + dimensionsString + '^' +
        ' -gravity Center' +
        ' -crop ' + dimensionsString + '+0+0 )' +
        ' ( ' + overlay +
        ' -resize ' + dimensionsString + '! )' +
        ' -composite' +
        format +
        ' ' + out
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(out)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'overlay'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        overlay: overlay || 'MISSING',
        dimensions: dimensions || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}

exports.blur = function (subject, radius, sigma, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var dimensionsString = dimensions.width + 'x' + dimensions.height
    var error
    if (subject && radius && sigma && dimensions && out) {
      execCommand(opts.convertPath.val + ' ' + limits + ' ' + subject +
        ' -resize ' + dimensionsString + '^' +
        ' -gravity Center' +
        ' -crop ' + dimensionsString + '+0+0' +
        ' -blur ' + radius + 'x' + sigma +
        format +
        ' ' + out
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(out)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'blur'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        radius: radius || 'MISSING',
        sigma: sigma || 'MISSING',
        dimensions: dimensions || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}

exports.darken = function (subject, color, factor, format, out) {
  return new Promise(function (resolve, reject) {
    var error
    if (subject && color && factor && out) {
      execCommand(opts.convertPath.val + ' ' + limits + ' ' + subject +
        ' -fill ' + color +
        ' -colorize ' + factor +
        format +
        ' ' + out
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(out)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'darken'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        color: color || 'MISSING',
        factor: factor || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}
exports.mask = function (subject, mask, color, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var dimensionsString = dimensions.width + 'x' + dimensions.height
    var error
    if (subject && mask && color && dimensions && out) {
      execCommand(opts.convertPath.val + ' ' + limits + ' -size ' + dimensionsString +
        ' xc:' + color +
        ' ( ' +
          ' ( ' + subject +
          ' -resize ' + dimensionsString + '^' +
          ' -gravity Center' +
          ' -crop ' + dimensionsString + '+0+0 )' +
          ' ( ' + mask +
          ' -resize ' + dimensionsString +
          ' -gravity Center )' +
          ' -compose CopyOpacity -composite' +
        ' )' +
        ' -gravity Center' +
        ' -geometry +0+0' +
        ' -compose src-over' +
        ' -composite ' +
        format +
        ' ' + out
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(out)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'mask'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        mask: mask || 'MISSING',
        color: color || 'MISSING',
        dimensions: dimensions || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}
exports.tMask = function (subject, mask, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var dimensionsString = dimensions.width + 'x' + dimensions.height
    var error
    if (subject && mask && dimensions && out) {
      execCommand(opts.convertPath.val + ' ' + limits +
        ' ( ' + subject +
        ' -resize ' + dimensionsString + '^' +
        ' -gravity Center' +
        ' -crop ' + dimensionsString + '+0+0 )' +
        ' ( ' + mask +
        ' -resize ' + dimensionsString +
        ' -gravity Center )' +
        ' -compose CopyOpacity -composite' +
        format +
        ' ' + out
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(out)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'tMask'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        mask: mask || 'MISSING',
        dimensions: dimensions || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}

exports.composite = function (subject, overlay, dimensions, format, out) {
  return new Promise(function (resolve, reject) {
    var dimensionsString = dimensions.width + 'x' + dimensions.height
    var error
    if (subject && overlay && dimensions && out) {
      execCommand(opts.convertPath.val + ' ' + limits +
        ' ( ' + subject +
        ' -resize ' + dimensionsString + '^' +
        ' -gravity Center' +
        ' -crop ' + dimensionsString + '+0+0 )' +
        ' ( ' + overlay +
        ' -resize ' + dimensionsString + '!' +
        ' -gravity Center )' +
        ' -compose CopyOpacity -composite' +
        format +
        ' ' + out
        , function (err) {
          if (err) {
            reject(err)
          } else {
            resolve(out)
          }
        })
    } else {
      error = new Error('Invalid request')
      error.fn = 'composite'
      error.details = 'invalid parameters'
      error.parameters = {
        subject: subject || 'MISSING',
        overlay: overlay || 'MISSING',
        dimensions: dimensions || 'MISSING',
        out: out || 'MISSING'
      }
      reject(error)
    }
  })
}
// exports.sprite = function (images, dimensions, tmpDir, maxCols, format, out) {
//   return new Promise(function (resolve, reject) {
//   var l
//     , nbLeft
//     , i
//     , subSprites
//     , stop
//     , spritePath
//     , subSpritePath
//     , error
//   if (images && dimensions && tmpDir && maxCols) {
//     l = images.length
//     nbLeft = Math.ceil(l / maxCols)
//     subSprites = []
//     spritePath = out + '.jpg'
//     if (l > maxCols) {
//       for (i = 0; i < l; i += maxCols) {
//         subSpritePath = tmpDir + '/' + i + '.jpg'
//         subSprites.push(subSpritePath)
//         exports.subSprite(images.slice(i, i + maxCols)
//           , dimensions
//           , format
//           , subSpritePath
//           , function (err) {
//             if (err) {
//               reject(err)
//             } else {
//               nbLeft -= 1
//               if (nbLeft === 0) {
//                 resolve(exports.assembleSprites(subSprites, spritePath))
//               }
//             }
//           })
//       }
//     } else {
//       resolve(exports.subSprite(images, dimensions, spritePath))
//     }
//   } else {
//     error = new Error("Invalid request")
//     error.fn = "sprite"
//     error.details = "invalid parameters"
//     error.parameters = {
//       images: images || "MISSING"
//       , dimensions: dimensions || "MISSING"
//       , tmpDir: tmpDir || "MISSING"
//       , maxCols: maxCols || "MISSING"
//     }
//     reject(error)
//   }
//   })
// }
// exports.subSprite = function (images, dimensions, format, out) {
//   return new Promise(function (resolve, reject) {
//   var dimensionsString = dimensions.width + "x" + dimensions.height
//     , imagesString = "'" + images.join("' '") + "'"
//     , error
//   if (images && dimensions && out) {
//     execCommand("gm convert " + imagesString
//       + " -resize '" + dimensionsString + "^'"
//       + " -gravity 'Center'"
//       + " -crop '" + dimensionsString + "+0+0'"
//       + " +append"
//       + format
//       + " '" + out + "'"
//       , function (err) {
//         if (err) {
//           reject(err)
//         } else {
//           resolve(out)
//         }
//       })
//   } else {
//     error = new Error("Invalid request")
//     error.fn = "subSprite"
//     error.details = "invalid parameters"
//     error.parameters = {
//       images: images || "MISSING"
//       , dimensions: dimensions || "MISSING"
//       , out: out || "MISSING"
//     }
//     reject(error)
//   }
//   })
// }
// exports.assembleSprites = function (images, out) {
//   return new Promise(function (resolve, reject) {
//   var imagesString = "'" + images.join("' '") + "'"
//     , error
//   if (images && out) {
//     execCommand("gm convert " + imagesString
//       + " -append"
//       + format
//       + " '" + out + "'"
//       , function (err) {
//         if (err) {
//           reject(err)
//         } else {
//           resole(out)
//         }
//       })
//   } else {
//     error = new Error("Invalid request")
//     error.fn = "assembleSprites"
//     error.details = "invalid parameters"
//     error.parameters = {
//       images: images || "MISSING"
//       , out: out || "MISSING"
//     }
//     reject(error)
//   }
//   })
// }

function execCommand (commandStr, cb) {
  var args = commandStr.split(' ').filter(function (item) {
    return item !== ''
  })
  var command = args.shift()
  if (opts.verbose.val) {
    console.log('args', args)
  }
  var proc = spawn(command
    , args
    , { cwd: cwd })
  pids[proc.pid] = commandStr
  var out = ''
  var err = ''
  proc.stdout.on('data', function (data) {
    out += data
  })
  proc.stderr.on('data', function (data) {
    err += data
  })
  proc.on('close', function (code) {
    delete pids[proc.pid]
    if (err !== '') {
      cb(err)
    } else {
      cb(null, out)
    }
  })
}

process.on('SIGINT', function () {
  process.exit()
})

process.on('exit', function () {
  killAllChildProcesses()
})

function killAllChildProcesses () {
  for (var key in pids) {
    console.log('killing', pids[key], 'pid', key)
    process.kill(key, 'SIGINT')
    delete pids[key]
  }
}
