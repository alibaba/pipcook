#!/usr/bin/env bash

chmod +x ./packages/cli/dist/bin/index.js
./packages/cli/dist/bin/index.js run ./test/pipelines/$1.json
