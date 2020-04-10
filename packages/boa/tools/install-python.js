'use strict';

const { run, PLATFORM, ARCH } = require('./utils');

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

// Start run the installation steps...
run('rm', '-rf', '.miniconda');
run(`curl ${CONDA_DOWNLOAD_PREFIX}/${CONDA_DOWNLOAD_NAME} > ${CONDA_DOWNLOAD_NAME}`);
run('sh', `./${CONDA_DOWNLOAD_NAME}`, '-b -p .miniconda');
run(`.miniconda/bin/pip`, 'install', '-r requirements.txt');
