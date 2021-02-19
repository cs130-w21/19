#!/usr/bin/env bash

# we ignore the root dir node_modules as that contains modules required to run both frontend and backend
# in development.

# we also ignore client's node module since client will simply have its assets built already. in ./client/build
 zip -r eb_bundle.zip . -x './client/node_modules/*' -x './.git/*' -x './.github/*' -x './node_modules'
