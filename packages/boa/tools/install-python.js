'use strict';

const { run, PLATFORM, ARCH } = require('./utils');
const fs = require('fs');

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

run('rm', '-rf .miniconda');
run('sh', `./${CONDA_DOWNLOAD_NAME}`, '-f -b -p .miniconda');
run('rm', '-rf .miniconda/lib/libstdc++.so*');
run('rm', '-rf .miniconda/lib/libgcc_s.so*');
run('.miniconda/bin/pip', 'install -r requirements.txt');
run('.miniconda/bin/conda', 'info -a');
