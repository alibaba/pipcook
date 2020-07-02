'use strict';
const { run, PLATFORM } = require('./utils');

const majorVersion = process.version.split('.')[0];
if (parseInt(majorVersion.substr(1)) < 12) {
  throw new TypeError(`require Node.js >= v12.0.0, but ${process.version} found`);
}

const cmds = [ 'rm', 'make', 'tar' ];

if (PLATFORM === 'linux') {
  cmds.push('wget');
} else if (PLATFORM === 'darwin') {
  cmds.push('curl');
} else {
  throw new TypeError(`No support for your platform ${PLATFORM}`);
}

cmds.forEach(cmd => {
  try {
    run(`command -v ${cmd}`);
  } catch (err) {
    throw new TypeError(`command ${cmd} check failed: ${err}`);
  }
})

