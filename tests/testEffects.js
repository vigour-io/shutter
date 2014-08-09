var imgManip = require('../imgManip')

	, subject = process.argv[2]
	, outDir = 'out'
	, logoMask = '../images/logo_mask.png'
	, avatarMask = '../images/avatar_mask.png'
	, overlay = 'gradient.png'
	, dimensions = { width: 370, height: 210 }

imgManip.smartResize(subject
	, dimensions
	, outDir + '/resized.png'
	, function (err){
		if (err) {
			console.log('smart resize error', err)
		} else {
	  	console.log('smart resize done')
	  }
	})

imgManip.darken(subject
	, '#171717'
	, '60'
	, outDir + '/darkened.png'
	, function (err) {
		if (err) {
			console.log('darken error', err)
		} else {
	  	console.log('darken done')
	  }
	})

imgManip.mask(subject
	, dimensions
	, logoMask
	, '#EE255C'
	, outDir + '/masked.png'
	, function (err) {
		if (err) {
			console.log('mask error', err)
		} else {
	  	console.log('mask done')
	  }
	})

imgManip.transparentMask(subject
	, dimensions
	, logoMask
	, outDir + '/transparentMasked.png'
	, function (err) {
		if (err) {
			console.log('transparent mask error', err)
		} else {
	  	console.log('transparent mask done')
	  }
	})

imgManip.overlay(subject
	, overlay
	, dimensions
	, outDir + '/overlaid.png'
	, function (err) {
		if (err) {
			console.log('overlay error', err)
		} else {
			console.log('overlay done')
		}
	})

imgManip.transparentMask(subject
	, { width: 150, height: 150 }
	, avatarMask
	, outDir + '/avatarMasked.png'
	, function (err) {
		if (err) {
			console.log('avatar mask error', err)
		} else {
	  	console.log('avatar mask done')
	  }
	})