'use strict'

var options
module.exports = {
  init: function (_options) {
    options = _options
  },
  effects: function (req, res, next) {
    var errors
    var validEffects = [
      'composite', 'mask', 'overlay', 'tMask', 'blur', 'overlayBlur', 'smartResize'
    ]
    var fileNameRE = /^[a-zA-Z][\w\.-]*$/

    // log.info('validating effects'.cyan)

    if (req.query.effect) {
      req.checkQuery('effect', 'effect should be a valid effect').isIn(validEffects)

      if (!errors) {
        if (~['mask', 'tMask'].indexOf(req.query.effect)) {
          req.checkQuery('mask', 'mask should be a valid file name, without the extension').matches(fileNameRE)
          if (req.query.effect === 'mask') {
            req.checkQuery('fillColor', 'fillColor should be a valid hexadecimal color').isHexColor()
            req.sanitize('fillColor').blacklist('#')
          }
        } else if (~['overlayBlur', 'overlay', 'composite'].indexOf(req.query.effect)) {
          req.checkQuery('overlay', '').matches(fileNameRE)
        }

        if (~['overlayBlur', 'blur'].indexOf(req.query.effect)) {
          req.checkQuery('radius', 'radius should be an integer').isInt()
          req.checkQuery('sigma', 'sigma should be an integer').isInt()
        }
      }
    }
    errors = req.validationErrors()
    if (errors) {
      res.status(400).end(options.invalidRequestMessage + '\n' + JSON.stringify(errors))
    } else {
      next()
    }
  },

  imgId: function (req, res, next) {
    var errors
    // log.info('validating image id'.cyan)
    req.checkParams('id', 'id should be alphanumeric').isAlphanumeric()
    errors = req.validationErrors()
    if (errors) {
      res.status(400).end(options.invalidRequestMessage + '\n' + JSON.stringify(errors))
    } else {
      next()
    }
  },

  imgURL: function (req, res, next) {
    var errors
    req.checkQuery('url', 'id should be an URL').isURL()
    errors = req.validationErrors()

    if (errors) {
      res.status(400).end(
        options.invalidRequestMessage + '\n' + JSON.stringify(errors)
      )
    } else {
      next()
    }
  },

  dimensions: function (fromQuery) {
    return function (req, res, next) {
      var errors
      var width
      var height
      var widthError = false
      var heightError = false

      if (fromQuery) {
        req.checkQuery('width', 'width should be an integer').isInt()
        req.checkQuery('height', 'height should be an integer').isInt()
      } else {
        req.checkParams('width', 'width should be an integer').isInt()
        req.checkParams('height', 'height should be an integer').isInt()
      }

      errors = req.validationErrors()
      width = parseInt(req.params.width, 10)

      if (width > options.maxWidth || width < 1) {
        widthError = true
      }
      height = parseInt(req.params.height, 10)
      if (height > options.maxHeight || height < 1) {
        heightError = true
      }

      if (errors || widthError || heightError) {
        res.status(400).end(options.invalidRequestMessage + '\n' + JSON.stringify(errors))
      } else {
        next()
      }
    }
  }
}
