#!/usr/bin/env bash
 zip -r eb_bundle.zip . -x './client/node_modules/*' -x './.git/*' -x './.github/*'
