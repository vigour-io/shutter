vigour-spriteMaker
==================

Makes a sprite out of an array of urls

## Dependencies
ImageMagick `brew install ImageMagick`

<a name='api'></a>
## API (Usage)
Issue a GET request to one of the following addresses to obtain the sprite corresponding to the provided parameters.

- `/:country/:lang/shows/:version`
- `/:country/:lang/episodes/:showId/:seasonId/:version`

### Parameters
- `:country` A full country name, like **Germany**
- `:lang` A language code, like **nl**
- `:showId` A show id, like **195**
- `:seasonsId` A season id, like **458**
- `:version` A sprite version identifier, one of
    + **small**
    + **large**
    + **retinaSmall**
    + **retinaLarge**

The parameters (except for `:version`) will be used to dig through the available data and find an object whose values (as opposed to keys) are objects containing an `img` property. For each element in this object, the `img` property is converted to a url with `url = 'http://images.mtvnn.com/' + img + '/306x172'`. The image found at that url is downloaded, resized and cropped. When this is done for each element in the object, the images assembled side by side as a horizontal sprite, saved as jpg, and sent back to the requester. If anything unexpected happens during this process, a plain text message is sent back to the requester.

The size of each tile in the sprite is determined by the value of `:version`:
- small: *70 X 45*
- large: *185 X 105*
- retinaSmall: *140 X 90*
- retinaLarge: *370 X 210*

<a name='dataStructure'></a>
### Structure of the available data
```
{
    ":country": {
        ":lang": {
            "shows": {
                ":showId": {
                    "id": Number,
                    "title": String,
                    "img": String,
                    "tag": String,
                    "cover": String,
                    "date": String,
                    "description": String,
                    "longDescription": String,
                    "seasons": {
                        ":seasonId": {
                            "id": Number,
                            "number": Number,
                            "episodes": {
                                ":episodeId": {
                                    "id": Number,
                                    "title": String,
                                    "number": Number,
                                    "date": String,
                                    "description": String,
                                    "longDescription": String,
                                    "img": "String",
                                    "video": String
                                }
                            }
                        }
                    }
                }
            },
            "channels": {

            }
        }
    }
}
```