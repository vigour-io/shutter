var imgManip = require('../imgManip')

	, subject = process.argv[2]
	, outDir = 'out'
	, logoMask = '../images/logo_mask.png'
	, avatarMask = '../images/avatar_mask.png'
	, overlay = '../images/overlay_2.png'
	, compositeOverlay = 'diagonalGradient.png'
	, dimensions = { width: 370, height: 210 }

imgManip.effect({}
	, subject
	, dimensions
	, outDir + '/resized'
	, function (err, path){
		if (err) {
			console.log('smart resize error', err)
		} else {
	  	console.log('smart resize done', path)
	  }
	})

// imgManip.darken(subject
// 	, '#171717'
// 	, '60'
// 	, outDir + '/darkened'
// 	, function (err, path) {
// 		if (err) {
// 			console.log('darken error', err)
// 		} else {
// 	  	console.log('darken done', path)
// 	  }
// 	})



imgManip.effect({
		effect: 'mask'
		, mask: 'logoMask'
		, fillColor: 'EE255C'
	}
	, subject
	, dimensions
	, outDir + '/masked'
	, function (err, path) {
		if (err) {
			console.log('mask error', err)
		} else {
	  	console.log('mask done', path)
	  }
	})

imgManip.effect({
		effect: 'tMask'
		, mask: 'logoMask'
	}
	, subject
	, dimensions
	, outDir + '/transparentMasked'
	, function (err, path) {
		if (err) {
			console.log('transparent mask error', err)
		} else {
	  	console.log('transparent mask done', path)
	  }
	})

imgManip.effect({
		effect: 'overlay'
		, overlay: 'overlay'
	}
	, subject
	, dimensions
	, outDir + '/overlaid'
	, function (err, path) {
		if (err) {
			console.log('overlay error', err)
		} else {
			console.log('overlay done', path)
		}
	})

imgManip.effect({
		effect: 'composite'
		, overlay: 'overlay'
	}
	, subject
	, dimensions
	, outDir + '/compositeOverlaid'
	, function (err, path) {
		if (err) {
			console.log('composite overlay error', err)
		} else {
			console.log('composite overlay done', path)
		}
	})

imgManip.effect({
		effect: 'tMask'
		, mask: 'avatarMask'
	}
	, subject
	, { width: 150, height: 150 }
	, outDir + '/avatar'
	, function (err, path) {
		if (err) {
			console.log('avatar effect error', err)
		} else {
			console.log('avatar effect done', path)
		}
	})

imgManip.effect({
		effect: 'blur'
		, radius: 0
		, sigma: 3
	}
	, subject
	, dimensions
	, outDir + '/blur'
	, function (err, path) {
		if (err) {
			console.log('blur effect error', err)
		} else {
			console.log('bluf effect done', path)
		}
	})

imgManip.effect({
		effect: 'overlayBlur'
		, overlay: 'overlay'
		, radius: 0
		, sigma: 4
	}
	, subject
	, dimensions
	, outDir + '/overlayBlur'
	, function (err, path) {
		if (err) {
			console.log('overlayBlur effect error', err)
		} else {
			console.log('overlayBlur effect done', path)
		}
	})