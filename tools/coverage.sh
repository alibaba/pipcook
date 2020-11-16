#!/bin/bash

rm -rf .nyc_output coverage
npx lerna run cov
echo 'find packages:'
find packages -name .nyc_output
find packages -name .nyc_output | xargs -I {} cp -r {}/ ./.nyc_output
echo 'ls:'
ls ./.nyc_output/
