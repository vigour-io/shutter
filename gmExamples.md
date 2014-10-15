# gm examples

## padded resize
Resizes an image so it fits inside the target dimensions, filling the rest of the space with specified color
`/usr/local/opt/imagemagick/bin/convert -size '370x210' xc:'#123456' \( subject2.jpg -resize '370x210' \) -gravity Center -geometry '+0+0' -composite out.png`

## smart resize
Resizes an image to the target dimensions, maintaining aspect ratio by croping the image, preserving its center
`gm convert subject.png -resize '370x210^' -gravity Center -crop '370x210+0+0' out.png`

## create sprite
Resizes a series of images to the same dimensions and makes a horizontal sprite out of the resized images
`gm convert subject.png subject2.jpg -resize '370x210^' -gravity Center -crop '370x210+0+0' +append out.png`

## darken
Covers the entire image with a 60% opacity #171717 overlay
`gm convert subject.png -fill "#171717" -colorize 60 out.png`

## add mask
Adds an mask over an image, making it transparent where the mask is transparent, and around the mask (when aspect ratios differ), smart resizing the image, but pad resizing the mask.
`/usr/local/opt/imagemagick/bin/convert \( subject2.jpg -resize "370x210^" -gravity Center -crop "370x210+0+0" \) \( "../images/logo_mask.png" -resize "370x210" -gravity "Center" \) -compose CopyOpacity -composite out.png`

## add mask with background color
Same as add mask, but replaces transparency with specified color
`/usr/local/opt/imagemagick/bin/convert -size "370x210" xc:"#EE255C" \( \( subject2.jpg -resize "370x210^" -gravity Center -crop "370x210+0+0" \) \( "../images/logo_mask.png" -resize "370x210" -gravity "Center" \) -compose CopyOpacity -composite \) -gravity Center -geometry +0+0 -compose src-over -composite out.png`

## overlay
smart resizes an image and stretch resizes an overlay, then adds the overlay over the image (covers the image entirely, only usefull with partly transparent overlays)
`/usr/local/opt/imagemagick/bin/convert \( subject2.jpg -resize '370x210^' -gravity Center -crop '370x210+0+0' \) \( gradient.png -resize '370x210!' \) -composite out.png`

## compress

```
var gm = require('gm')

gm(process.argv[2]).compress('Lossless').write('compressed.png', function (err) {
    if (err) {
        console.log('Error:', err)
    } else {
        console.log('done')
    }
})
```