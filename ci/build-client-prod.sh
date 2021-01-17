#!/usr/bin/env sh
set -e -o pipefail;


# build client
cd client;
yarn install;
yarn run build;


# TODO: upload to aws EB.


