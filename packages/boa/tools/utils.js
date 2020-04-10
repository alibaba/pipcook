'use strict';

const os = require('os');
const { execSync } = require('child_process');

exports.run = (...args) => execSync.call(null, args.join(' '), { stdio: 'inherit' });
exports.PLATFORM = os.platform();
exports.ARCH = os.arch();
