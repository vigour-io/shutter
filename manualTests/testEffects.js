var imgManip = require('../imgManip')

	, subject = process.argv[2]
	, outDir = 'out'
	, logoMask = '../images/logo_mask.png'
	, avatarMask = '../images/avatar_mask.png'
	, overlay = '../images/overlay_2.png'
	, compositeOverlay = 'diagonalGradient.png'
	, dimensions = { width: 370, height: 210 }

imgManip.smartResize(subject
	, dimensions
	, outDir + '/resized'
	, function (err, path){
		if (err) {
			console.log('smart resize error', err)
		} else {
	  	console.log('smart resize done', path)
	  }
	})

imgManip.darken(subject
	, '#171717'
	, '60'
	, outDir + '/darkened'
	, function (err, path) {
		if (err) {
			console.log('darken error', err)
		} else {
	  	console.log('darken done', path)
	  }
	})

imgManip.mask(subject
	, logoMask
	, '#EE255C'
	, dimensions
	, outDir + '/masked'
	, function (err, path) {
		if (err) {
			console.log('mask error', err)
		} else {
	  	console.log('mask done', path)
	  }
	})

imgManip.transparentMask(subject
	, logoMask
	, dimensions
	, outDir + '/transparentMasked'
	, function (err, path) {
		if (err) {
			console.log('transparent mask error', err)
		} else {
	  	console.log('transparent mask done', path)
	  }
	})

imgManip.overlay(subject
	, overlay
	, dimensions
	, outDir + '/overlaid'
	, function (err, path) {
		if (err) {
			console.log('overlay error', err)
		} else {
			console.log('overlay done', path)
		}
	})

imgManip.compositeOverlay(subject
	, compositeOverlay
	, dimensions
	, outDir + '/compositeOverlaid'
	, function (err, path) {
		if (err) {
			console.log('composite overlay error', err)
		} else {
			console.log('composite overlay done', path)
		}
	})

imgManip.transparentMask(subject
	, avatarMask
	, { width: 150, height: 150 }
	, outDir + '/avatarMasked'
	, function (err, path) {
		if (err) {
			console.log('avatar mask error', err)
		} else {
	  	console.log('avatar mask done', path)
	  }
	})

imgManip.effect('avatar'
	, subject
	, { width: 150, height: 150 }
	, outDir + '/avatarEffect'
	, function (err, path) {
		if (err) {
			console.log('avatar effect error', err)
		} else {
			console.log('avatar effect done', path)
		}
	})