'use strict'
module.exports = {
  debug: {
    doc: 'Application in debug mode',
    format: Boolean,
    default: false,
    env: 'DEBUG',
    arg: 'debug'
  },
  env: {
    doc: 'The applicaton environment.',
    format: ['develop', 'test', 'staging', 'production'],
    default: 'develop',
    env: 'NODE_ENV',
    arg: 'node-env'
  },
  maxCols: {
    doc: '',
    format: Number,
    default: 10
  },
  maxTries: {
    doc: '',
    format: Number,
    default: 6
  },
  invalidRequestMessage: {
    doc: 'Message to display when a invalid request is made',
    format: String,
    default: 'Invalid request. Make sure you are respecting the api (https://github.com/vigour-io/shutter/blob/master/README.md#user-content-api) and that the requested data exists.'
  },
  images: {
    sizes: {
      maxWidth: {
        doc: 'The Maximum width of the images',
        format: Number,
        default: 10000
      },
      maxHeight: {
        doc: 'The Maximum height of the images',
        format: Number,
        default: 10000
      }
    }
  },
  minFreeSpace: {
    doc: 'The minimum amount of free space needed',
    format: Number,
    default: 0.3
  },
  convertPath: {
    doc: 'Path to Image Magick\'s `convert` executable',
    format: String,
    default: '',
    env: 'SHUTTER_CONVERT_PATH'
  },
  identifyPath: {
    doc: 'Path to Image Magick\'s `identify` executable',
    format: String,
    default: '',
    env: 'SHUTTER_IDENTIFY_PATH'
  },
  clean: {
    doc: 'Removes all downloaded originals, produced images and temporary folders and files, then exits',
    format: Boolean,
    default: false,
    arg: 'clean'
  },
  manip: {
    doc: 'Manipulations of images',
    format: Array,
    default: []
  },
  remote: {
    host: {
      doc: 'URL for the remote image server to use for image manipulations',
      format: String,
      default: 'img.vigour.io'
    },
    port: {
      doc: 'Port on which to reach the remote image server',
      format: Number,
      default: 80
    }
  },
  server: {
    ip: {
      doc: 'IP for the server',
      format: String,
      env: 'SHUTTER_SERVER_IP'
    },
    port: {
      doc: 'Port for the server to listen',
      format: Number,
      default: 8000,
      env: 'SHUTTER_SERVER_PORT'
    }
  },
  fallbacks: {
    doc: 'JSON string describing fallback images. see README.md',
    format: Object,
    default: {}
  },
  retryOn404: {
    doc: 'Should we try to retrieve the image again on 404',
    format: Boolean,
    default: false
  },
  clients: {
    aws: {
      access_key_id: {
        doc: 'AWS Access Key should be set to env: AWS_ACCESS_KEY_ID',
        format: String,
        default: null,
        env: 'AWS_ACCESS_KEY_ID'
      },
      secret_access_key: {
        doc: 'AWS Secret Access Key should be set to env: AWS_SECRET_ACCESS_KEY',
        format: String,
        default: null,
        env: 'AWS_SECRET_ACCESS_KEY'
      },
      cloudfront: {
        apiVersion: {
          doc: 'aws-sdk api version to use when invalidating cloudfront assets',
          format: String,
          default: '2016-01-28'
        },
        distributionId: {
          doc: 'ID of the distribution on CloudFront on which to perform invalidations',
          format: String,
          default: null,
          env: 'AWS_CLOUDFRONT_DISTRIBUTION_ID'
        }
      }
    }
  }
}
