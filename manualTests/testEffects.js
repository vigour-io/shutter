var imgManip = require('../imgManip')

	, subject = process.argv[2]
	, outDir = 'out'
	, logoMask = '../images/logo_mask.png'
	, avatarMask = '../images/avatar_mask.png'
	, overlay = 'gradient.png'
	, compositeOverlay = 'diagonalGradient.png'
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
	, logoMask
	, '#EE255C'
	, dimensions
	, outDir + '/masked.png'
	, function (err) {
		if (err) {
			console.log('mask error', err)
		} else {
	  	console.log('mask done')
	  }
	})

imgManip.transparentMask(subject
	, logoMask
	, dimensions
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

imgManip.compositeOverlay(subject
	, compositeOverlay
	, dimensions
	, outDir + '/compositeOverlaid.png'
	, function (err) {
		if (err) {
			console.log('composite overlay error', err)
		} else {
			console.log('composite overlay done')
		}
	})

imgManip.transparentMask(subject
	, avatarMask
	, { width: 150, height: 150 }
	, outDir + '/avatarMasked.png'
	, function (err) {
		if (err) {
			console.log('avatar mask error', err)
		} else {
	  	console.log('avatar mask done')
	  }
	})