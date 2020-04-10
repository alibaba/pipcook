'use strict';

const path = require('path');
const { run } = require('./utils');

const BINDING_PATH = path.join(__dirname, '../build/Release/boa.node');
// run('readelf', `-d ${BINDING_PATH}`);
run('ldd', BINDING_PATH);
run('pwd');
run('ls', path.join(__dirname, '../.miniconda/lib/python3.7/lib-dynload'));
run('node', path.join(__dirname, '../tests/base/eval.js'));
