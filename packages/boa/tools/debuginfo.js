'use strict';

const path = require('path');
const { run } = require('./utils');

run('ldd', path.join(__dirname, '../build/Release/boa.node'));
run('ls', path.join(__dirname, '../.miniconda/lib/python3.7/lib-dynload'));
