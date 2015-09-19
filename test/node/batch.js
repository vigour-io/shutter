/* global describe, it, expect, before, after */

var path = require('path')
var flatten = require('lodash/array/flatten')
var clone = require('lodash/lang/clone')
var imgServer = require('../../')
var handle

var srcPath = path.join(__dirname, '..', 'data', 'sam ple.jpg')
var outDir = path.join(__dirname, 'out')

describe('batch (timeout: 5min)', function () {
  this.timeout(5 * 60 * 1000)
  before(function () {
    return imgServer()
      .then(function (_handle) {
        handle = _handle
      })
  })
  after(function (done) {
    handle.close(function () {
      done()
    })
  })

  it('post'
  , function () {
    var sizes = [250/*, 500, 1000, 5000*/]
    var effects = [
      {},
      { effect: 'smartResize' },
      { effect: 'composite',
        overlay: 'overlay'
      },
      { effect: 'blur',
        radius: 5,
        sigma: 3
      },
      { effect: 'tMask',
        mask: 'avatarMask'
      },
      { effect: 'mask',
        mask: 'logoMask',
        fillColor: 'EE255C'
      },
      { effect: 'overlay',
        overlay: 'overlay'
      },
      { effect: 'tMask',
        mask: 'logoMask'
      },
      { effect: 'overlayBlur',
        overlay: 'overlay',
        radius: 5,
        sigma: 3
      }
    ]

    var sized = flatten(effects.map(function (effect) {
      effect.dst = path.join(outDir, effect.effect || 'none')
      if (effect.mask) {
        effect.dst += '_' + effect.mask
      }
      return sizes.map(function (size) {
        var thisEffect = clone(effect)
        thisEffect.width = size
        thisEffect.height = size
        thisEffect.dst += '_' + size + 'x' + size
        return thisEffect
      })
    }))

    var png = sized.map(function (item) {
      var thisItem = clone(item)
      thisItem.outType = 'png'
      thisItem.dst += '.png'
      return thisItem
    })

    var jpg = sized.map(function (item) {
      var thisItem = clone(item)
      thisItem.outType = 'jpg'
      thisItem.dst += '.jpg'
      return thisItem
    })

    var manips = sized.concat(png, jpg)
    var obj = {
      manip: [{
        src: srcPath,
        batch: manips
      }],
      convertPath: 'forceRemote',
      remote: 'localhost',
      remotePort: '8000'
    }

    return imgServer(obj)
      .then(function (val) {
        expect(val).to.be.an.array
      })
  })
})
