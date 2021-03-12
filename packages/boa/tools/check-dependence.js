#!/usr/bin/env node

'use strict';
const { run, PLATFORM } = require('./utils');
const cmds = [ 'rm', 'make', 'tar' ];

if (PLATFORM === 'linux') {
  cmds.push('wget');
} else if (PLATFORM === 'darwin') {
  cmds.push('curl');
} else {
  throw new TypeError(`no support for your platform ${PLATFORM}`);
}

cmds.forEach(cmd => {
  try {
    run(`command -v ${cmd}`);
  } catch (err) {
    throw new TypeError(`command ${cmd} check failed: ${err}`);
  }
});
