'use strict';

const path = require('path');
const { pip } = require('./utils');

pip('install', `-r ${path.join(__dirname, '../requirements.txt')}`);
pip('install', ' --upgrade --force-reinstall numpy');
