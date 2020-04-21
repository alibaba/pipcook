'use strict';

const path = require('path');
const { run, getCondaPath, PLATFORM, ARCH } = require('./utils');

const CONDA_LOCAL_PATH = getCondaPath();
const PIP_BINARY = path.join(CONDA_LOCAL_PATH, 'bin/pip');
run(PIP_BINARY, 'install', `-r ${path.join(__dirname, '../requirements.txt')}`);
