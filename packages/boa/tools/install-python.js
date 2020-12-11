#!/usr/bin/env node

'use strict';

const utils = require('./utils');
const fs = require('fs');

const run = utils.run.bind(utils);
const py = utils.py.bind(utils);

if (!utils.shouldInstallConda()) {
  console.info('skip installing the python from conda.');
  return process.exit(0);
}

// download and install conda
const remoteURL = utils.getCondaRemote();
const installDir = utils.resolveAndUpdateCondaPath();
const downloader = utils.getCondaDownloaderName();

// fetch the downloader file if that doesn't exist.
if (!fs.existsSync(downloader)) {
  run('curl', `${remoteURL}/${downloader}`, '>', downloader);
}

// check if the python is installed correctly, we will skip the installation
// when it's installed before.
if (!utils.shouldPythonInstalledOn(installDir)) {
  // clean the install dir.
  run('rm', '-rf', installDir);
  // install
  run('sh', downloader, `-f -b -p ${installDir}`);
}

// cleanup the standard libs.
if (utils.PLATFORM === 'darwin') {
  run('rm', '-rf', `${installDir}/lib/libc++*`);
} else if (utils.PLATFORM === 'linux') {
  run('rm', '-rf', `${installDir}/lib/libstdc++.so*`);
  run('rm', '-rf', `${installDir}/lib/libgcc_s.so*`);
}

// dump info
py(`${installDir}/bin/conda`, 'info -a');

// install python packages
utils.installPythonPackages();
