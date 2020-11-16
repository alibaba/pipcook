#!/bin/bash

rm -rf .nyc_output coverage && npx lerna run cov && find packages -name .nyc_output | xargs -I {} cp -r {}/ ./.nyc_output
