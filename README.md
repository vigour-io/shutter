shutter
==================

Image manipulation service

<a name='api'></a>
## Usage
- POST an image to `/image/:width/:height` (see `test/node/post.js`)
- GET `/image/:width/:height?url=<SOURCE_IMAGE_URL>` (see `test/node/get.js`)
- GET `/invalidate/<any of the above>` : Removes the corresponding image from cache (both the requested image and the original unmodified download or posted file)
- In all cases, add `&cache=false` if you don't want the resulting image to be cached on the server.
- In all cases, add `&fallback=<URL>` if you want to provide a fallback image for the cases when reqested image can't be downloaded
- (*Obsolete*) GET `/image/:id/:width/:height`

#### Notes
- Both width and height have a maximum of 10000
- Check https://github.com/vigour-io/shutter/tree/master/images for available masks and overlays
- Check http://www.imagemagick.org/Usage/blur/blur_montage.jpg for blur arguments radius and sigma (<radius>x<sigma>)

### Fallback images

If you ask the shutter for an image it can not find, it will try responding with a fallback image of the same dimensions following this procedure:

1. If you have included `&fallback=<URL>` in your query string, the image found at that URL will be downloaded, resized, and sent as a fallback image, along with the following extra header: `X-Fallback-Type: 'provided'`
2. If not, Shutter will look at the domain of the requested image and try to match it with one of the domains provided to shutter on startup (see below). If the domain is found, the fallback associated to that domain will be downloaded, resized, and sent as a fallback image, along with the following extra header: `X-Fallback-Type: 'domain'`
3. If the domain doesn't match any of the domains provided to Shutter on startup, Shutter will download, resize and send the default fallback image provided to Shutter on startup (see below), along with the following extra header: `X-Fallback-Type: 'default'`

To provide the Shutter with a default fallback image, set its `fallbacks` property value to the URL of the desired fallback image (example below)
To provide the Shutter with domain-specific fallbacks, add some properties to its `fallbacks` property with the key being a domain and the value being a URL (example below)

#### Example

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

Don't forget to merge the config when starting the shutter
```sh
shutter --mergeFiles '["./fallbackConfig.json"]'
```

#### Effects
See `test/node/post.js` and `test/node/get.js`

## Installation
### dependencies
- ImageMagick `brew install ImageMagick` or `sudo yum install ImageMagick`
- Forever `sudo npm install -g forever`
- Start an instance of vigour-hub with MTV data, or get the url for an existing one (obsolete soon)
- In config.js, set cloudHost and cloudPort to point the that hub (obsolete soon)

### launch
- Add path to ImageMagick's convert command as environment variable `IMG_CONVERT_PATH`, e.g.
    + On EC2 instance: `export IMG_CONVERT_PATH=/usr/bin/convert`
    + On my computer: `export IMG_CONVERT_PATH=/usr/local/opt/imagemagick/bin/convert`
- Start the server (`nohup npm start &`)


## Deployment

`docker run -t -i --env IMG_CONVERT_PATH=$IMG_CONVERT_PATH vigourio/img-server`

----

## OBSOLETE

queryString | options | result
---|---|---
smartResize | | Image is resized to the specified dimensions, conserving aspect ratios by cropping around the center. Option is ignored
mask | *image name* |

### Parameters
- `:country` A full country name, like **Germany**
- `:lang` A language code, like **nl**
- `:showId` A show id, like **195**
- `:seasonsId` A season id, like **458**
- `:width` Desired width for each tile
- `:height` Desired height for each tile

The parameters (except for `:width` and `:height`) will be used to dig through the available data and find an object whose values (as opposed to keys) are objects containing an `img` property. For each element in this object, the `img` property is converted to a url with `url = 'http://images.mtvnn.com/' + img + '/306x172'`. The image found at that url is downloaded, resized and cropped to the desired width and height. When this is done for each element in the object, the images are assembled side by side as a horizontal sprite, saved as jpg, and sent back to the requester. If anything unexpected happens during this process, a plain text error message is sent back to the requester.

<a name='dataStructure'></a>
### Structure of the available data
```
{
    ":country": {
        ":lang": {
            "shows": {
                ":showId": {
                    "img": String,
                    "number": Number,
                    "seasons": {
                        ":seasonId": {
                            "number": Number,
                            "episodes": {
                                ":episodeId": {
                                    "img": String,
                                    "number": Number
                                }
                            }
                        }
                    }
                }
            },
            "channels": {
                "img": String,
                "number": Number
            }
        }
    }
}
```

### Known issues
```
Error creating sprite: Error: Command failed: gm convert: No decode delegate for this image format (tmp/<temporary_directory_name>/<image_id>).
```
If you get this error when requesting a sprite, trying again often works. If not, make sure the data is correct (the provided image ids should correspond to existing images at `http://images.mtvnn.com/<image_id>/306x172`)
