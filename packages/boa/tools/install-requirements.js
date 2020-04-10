'use strict';

const path = require('path');
const { run, PLATFORM, ARCH } = require('./utils');

const PIP_BINARY = path.join(__dirname, '../.miniconda/bin/pip');
run(PIP_BINARY, 'install', `-r ${path.join(__dirname, '../requirements.txt')}`);
