#!/bin/sh
SHUTTER_AWS_ACCESS_KEY_ID="ABC" \
SHUTTER_AWS_SECRET_ACCESS_KEY="DEF" \
SHUTTER_CLOUDFRONT_DISTRIBUTION_ID="1234" \
NODE_ENV="test" \
gaston test -r node -s test/node/errors.js
# npm run test
