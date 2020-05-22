#!/usr/bin/env sh

PIPCOOK=./packages/cli/dist/bin/pipcook

$PIPCOOK init
$PIPCOOK daemon start
$PIPCOOK run ./test/pipelines/$1.json
