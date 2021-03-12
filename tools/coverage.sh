#!/bin/bash

# clear old data
rm -rf .nyc_output coverage && \
# generate coverage file
npx lerna run cov && \
# merge coverage directory into package root
find packages -type d -name .nyc_output -exec cp -r {} ./ \;
