#!/bin/bash

rm -rf .nyc_output coverage
find packages -name .nyc_output
npx lerna run cov && find packages -name .nyc_output | xargs -I {} cp -r {}/ ./.nyc_output
ls ./.nyc_output/
