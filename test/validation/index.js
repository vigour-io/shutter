var validate = require('./validation')

var invalidData = {}

describe('validation', function(){

  describe('dimension', function(){

    it('should require dimensions on any request', function(){

      var validData = {
        width: 300,
        height: 500
      }

      // validate.dimension(validData)

      // assert(validate.dimension(validData), 're')

    })

  })

  describe('effect', function(){

    describe('blur', function(){

      it('should require sigma or radius as parameters', function(){

      })

    })


    describe('overlay', function(){

      it('should require overlay type as parameter', function(){

      })

    })


    describe('mask', function(){

      it('should require mask type as parameter', function(){

      })

    })


    describe('smart resize', function(){

      it('', function(){

      })

    })

  })

})