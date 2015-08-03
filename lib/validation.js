var log = require('npmlog')
var options
module.exports = {
  init: function (_options) {
    options = _options
  },
  effects: function(req, res, next) {
    var errors, validEffects = [
        'composite', 'mask', 'overlay', 'tMask', 'blur', 'overlayBlur', 'smartResize'
      ],
      fileNameRE = /^[a-zA-Z][\w\.-]*$/

    // log.info('validating effects'.cyan)

    if (req.query.effect) {
      req.checkQuery('effect', 'effect should be a valid effect').isIn(validEffects)

      if (!errors) {

        if (~['mask', 'tMask'].indexOf(req.query.effect)) {
          req.checkQuery('mask', "mask should be a valid file name, without the extension").matches(fileNameRE)
          if (req.query.effect === 'mask') {
            req.checkQuery('fillColor', "fillColor should be a valid hexadecimal color").isHexColor()
            req.sanitize('fillColor').blacklist('#')
          }

        } else if (~['overlayBlur', 'overlay', 'composite'].indexOf(req.query.effect)) {
          req.checkQuery('overlay', '').matches(fileNameRE)
        }

        if (~['overlayBlur', 'blur'].indexOf(req.query.effect)) {
          req.checkQuery('radius', "radius should be an integer").isInt()
          req.checkQuery('sigma', "sigma should be an integer").isInt()
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

  imgId: function(req, res, next) {
    var errors
    // log.info('validating image id'.cyan)
    req.checkParams('id', "id should be alphanumeric").isAlphanumeric()
    errors = req.validationErrors()
    if (errors) {
      res.status(400).end(options.invalidRequestMessage + '\n' + JSON.stringify(errors))
    } else {
      next()
    }
  },

  imgURL: function(req, res, next) {
    var errors
    // log.info('validating image URL'.cyan)
    req.checkQuery('url', "id should be an URL").isURL()
    errors = req.validationErrors()

    if (errors)
      res.status(400).end(
        options.invalidRequestMessage + '\n' + JSON.stringify(errors)
      )
    else
      next()
  },

  dimensions: function(req, res, next) {
    var errors, width, height, widthError = false,
      heightError = false

    // log.info('validating dimensions!'.cyan)

    req.checkParams('width', 'width should be an integer').isInt()
    req.checkParams('height', 'height should be an integer').isInt()

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
