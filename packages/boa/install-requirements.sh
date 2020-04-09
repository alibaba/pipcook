#!/usr/bin/env sh

# install test toolkit
brew install clang-format

# install python packages
`brew --prefix python@3`/bin/pip3 install -r requirements.txt
