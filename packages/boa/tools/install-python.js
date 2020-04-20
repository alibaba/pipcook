'use strict';

const { run, initAndGetCondaPath, PLATFORM, ARCH } = require('./utils');
const fs = require('fs');
const path = require('path');

const CONDA_DOWNLOAD_PREFIX = 'https://repo.anaconda.com/miniconda';
const CONDA_LOCAL_PATH = initAndGetCondaPath();
let condaDownloadName = 'Miniconda3-latest';

if (PLATFORM === 'linux') {
  condaDownloadName += '-Linux';
} else if (PLATFORM === 'darwin') {
  condaDownloadName += '-MacOSX';
} else {
  throw new TypeError(`No support for your platform ${PLATFORM}`);
}

if (ARCH === 'x64') {
  condaDownloadName += '-x86_64';
} else if (PLATFORM !== 'darwin') {
  condaDownloadName += '-x86';
}
condaDownloadName = `${condaDownloadName}.sh`;

if (!fs.existsSync(condaDownloadName)) {
  run(`curl ${CONDA_DOWNLOAD_PREFIX}/${condaDownloadName} > ${condaDownloadName}`);
}

if (!fs.existsSync(path.join(CONDA_LOCAL_PATH, 'bin', 'python'))) {
  run('rm', `-rf ${CONDA_LOCAL_PATH}`);
  run('sh', `./${condaDownloadName}`, `-f -b -p ${CONDA_LOCAL_PATH}`);
  run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libstdc++.so*`);
  run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libgcc_s.so*`);
}

// dump info
run(`${CONDA_LOCAL_PATH}/bin/conda`, 'info -a');
