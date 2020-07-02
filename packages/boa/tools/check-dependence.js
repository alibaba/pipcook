'use strict';
const { run, PLATFORM } = require('./utils');
const version = process.version.split('.')[0];

if (parseInt(version.substr(1)) < 12) {
  throw new TypeError(`require Node.js >= v12.0.0, but ${process.version} found`);
}

let cmds = [ 'rm', 'make', 'tar' ];

if (PLATFORM === 'linux') {
  cmds = cmds.concat([ 'wget' ]);
} else if (PLATFORM === 'darwin') {
  cmds = cmds.concat([ 'curl' ]);
} else {
  throw new TypeError(`No support for your platform ${PLATFORM}`);
}

cmds.forEach(cmd => {
  console.log('checking:');
  try {
    run(`command -v ${cmd}`);
  } catch (err) {
    throw new TypeError(`command ${cmd} check failed: ${err}`);
  }
})

