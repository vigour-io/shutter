vigour-shutter
==================

Online image manipulation service

## Usage

See the [vigour-config docs](https://github.com/vigour-io/config#readme) for information on how to configure and launch the shutter and where to get more info for all the configuration options.

As a minimum, you will to provide the following configuration options:

- `convertPath` (`IMG_CONVERT_PATH`)
- `identifyPath` (`IMG_IDENTIFY_PATH`)

And for AWS:

- Access Key Id (`AWS_ACCESS_KEY_ID`)
- Access Secret (`AWS_SECRET_ACCESS_KEY`)
- Cloudfront Distribution ID (`AWS_CLOUDFRONT_DISTRIBUTION_ID`)

### Dependencies
- ImageMagick `brew install ImageMagick` or `sudo yum install ImageMagick`

<a name='api'></a>
## API

- POST an image to `/image` (see `test/node/post.js`)
- GET `/image?url=<SOURCE_IMAGE_URL>` (see `test/node/get.js`)
- GET `/invalidate/<any of the above>` : Removes the corresponding image from shutter's cache (both the requested image and the original unmodified download) and from the CloudFront cache if configured

In all cases, you can use any of the following query string parameters to modifying the behavior:
- use `&width=<INTEGER>` to resize the image to that width, conserving aspect ratio (maximum: 10000)
- use `&height=<INTEGER>` to resize the image to that width, conserving aspect ratio (maximum: 10000)
- use `&cache=false` if you don't want the resulting image to be cached by the shutter
- use `&fallback=<URL>` if you want to provide a fallback image for the cases when requested image can't be downloaded
- use `$effect=<EFFECT>` to manipulate the image (see [effects](#effects) below)

#### Notes
- See https://github.com/vigour-io/shutter/tree/master/images for available masks and overlays
- See http://www.imagemagick.org/Usage/blur/blur_montage.jpg for `blur` and `overlayBlur` arguments `radius` and `sigma` (<radius>x<sigma>)

### Fallback images

If you ask the shutter for an image it can not find, it will try responding with a fallback image of the same dimensions following this procedure:

1. If you have included `&fallback=<URL>` in your query string, the image found at that URL will be downloaded, resized, transformed according to the specified effect (if any) and sent as a fallback image, along with the following extra header: `X-Fallback-Type: 'provided'`
2. If not, Shutter will look at the domain of the requested image and try to match it with one of the domains provided to shutter on startup (see below). If the domain is found, the fallback associated to that domain will be downloaded, resized, transformed according to the specified effect (if any) and sent as a fallback image, along with the following extra header: `X-Fallback-Type: 'domain'`
3. If the domain doesn't match any of the domains provided to Shutter on startup, Shutter will download, resize, transform according to the specified effect (if any) and send the default fallback image provided to Shutter on startup (see below), along with the following extra header: `X-Fallback-Type: 'default'`

- To provide the Shutter with a default fallback image, set its `fallbacks` property value to the URL of the desired fallback image (example below)
- To provide the Shutter with domain-specific fallbacks, add some properties to its `fallbacks` property with the key being a domain and the value being a URL (example below)

#### Examples

##### One-time fallback image
```sh
GET /image?url=http://uhohIdontexist.com/returns404.png&width=900&height=600&fallback=http://thankgodIexist.com/img.png
```
##### Configuring fallback images:

***fallbackConfig.json***
```json
{
  "fallbacks": {
    "val": "<DEFAULT_FALLBACK_URL>",
    "somedomain.com": "<FALLBACK_URL_FOR_somedomain.com>",
    "anotherdomain.com": "<FALLBACK_URL_FOR_anotherdomain.com>"
  }
}
```

Don't forget to merge the config when starting the shutter (see [usage](#usage))
```sh
shutter --mergeFiles '["./fallbackConfig.json"]'
```

#### Effects

- '&effect=composite&overlay=overlay',
- '&effect=blur&radius=0&sigma=3',
- '&effect=tMask&mask=avatarMask',
- '&effect=mask&mask=logoMask&fillColor=EE255C',
- '&effect=overlay&overlay=overlay',
- '&effect=tMask&mask=logoMask',
- '&effect=overlayBlur&overlay=overlay&radius=0&sigma=3'

See [test/node/post.js](test/node/post.js) and [test/node/get.js](test/node/get.js)
