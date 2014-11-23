vigour-img
==================

Makes a sprite out of an array of urls

## Dependencies
ImageMagick `brew install ImageMagick` or `sudo yum install ImageMagick`
GraphicsMagick `sudo yum install GraphicsMagick`
Forever `sudo npm install -g forever`

<a name='api'></a>
## Usage
- Start an instance of vigour-hub
- In **config.js**, set `cloudHost` and `cloudPort` to point the that hub
- Populate it with MTV data
- Add path to ImageMagick's convert command as environment variable `IM_CONVERT_PATH`, e.g.
    + On EC2 instance: `export IM_CONVERT_PATH=/usr/bin/convert`
    + On my computer: `export IM_CONVERT_PATH=/usr/local/opt/imagemagick/bin/convert`
- Start the server (`nohup npm start &`)
- Logging will be available in `nohup.out`
- Issue a GET request to one of the following addresses to obtain the sprite corresponding to the provided parameters
    + `/sprite/:country/:lang/shows/:width/:height`
    + `/sprite/:country/:lang/episodes/:showId/:seasonId/:width/:height`
- Issue a GET request to the following address to obtain a single image corresponding to the parameters provided in the route and the query string. 
    + `/image/:id/:width/:height`, examples:
        * `/image/55f50432fd73e366c69956ad3cb97a59/150/150?effect=tMask&mask=avatarMask`
        * `/image/55f50432fd73e366c69956ad3cb97a59/370/210?effect=composite&overlay=overlay`
        * `/image/55f50432fd73e366c69956ad3cb97a59/370/210?effect=mask&mask=logoMask&fillColor=EE255C`
        * `/image/55f50432fd73e366c69956ad3cb97a59/370/210?effect=overlay&overlay=overlay`
        * `/image/55f50432fd73e366c69956ad3cb97a59/370/210` (equivalent to `/image/55f50432fd73e366c69956ad3cb97a59/370/210?effect=smartResize`)
        * `/image/55f50432fd73e366c69956ad3cb97a59/370/210?effect=tMask&mask=logoMask`
        * `/image/55f50432fd73e366c69956ad3cb97a59/370/210?effect=blur&radius=0&sigma=3`
        * `/image/55f50432fd73e366c69956ad3cb97a59/370/210?effect=overlayBlur&overlay=overlay&radius=0&sigma=3`
    + Check `vigour-img/images/` for available masks and overlays
    + Check `http://www.imagemagick.org/Usage/blur/blur_montage.jpg` for blur arguments radius and sigma (<radius>x<sigma>)

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