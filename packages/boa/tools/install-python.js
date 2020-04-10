'use strict';

const { run, PLATFORM, ARCH } = require('./utils');
const fs = require('fs');
const path = require('path');

const CONDA_DOWNLOAD_PREFIX = 'https://repo.anaconda.com/miniconda';
let CONDA_DOWNLOAD_NAME = 'Miniconda3-latest';

if (PLATFORM === 'linux') {
  CONDA_DOWNLOAD_NAME += '-Linux';
} else if (PLATFORM === 'darwin') {
  CONDA_DOWNLOAD_NAME += '-MacOSX';
} else {
  throw new TypeError(`No support for your platform ${PLATFORM}`);
}

if (ARCH === 'x64') {
  CONDA_DOWNLOAD_NAME += '-x86_64';
} else if (PLATFORM !== 'darwin') {
  CONDA_DOWNLOAD_NAME += '-x86';
}
CONDA_DOWNLOAD_NAME = `${CONDA_DOWNLOAD_NAME}.sh`;

if (!fs.existsSync(CONDA_DOWNLOAD_NAME)) {
  run(`curl ${CONDA_DOWNLOAD_PREFIX}/${CONDA_DOWNLOAD_NAME} > ${CONDA_DOWNLOAD_NAME}`);
}

const CONDA_LOCAL_PATH = path.join(__dirname, '../.miniconda');

run('rm', `-rf ${CONDA_LOCAL_PATH}`);
run('sh', `./${CONDA_DOWNLOAD_NAME}`, `-f -b -p ${CONDA_LOCAL_PATH}`);
run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libstdc++.so*`);
run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libgcc_s.so*`);

// dump info
run(`${CONDA_LOCAL_PATH}/bin/conda`, 'info -a');
