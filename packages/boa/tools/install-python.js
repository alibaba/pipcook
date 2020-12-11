'use strict';

const { run, py, initAndGetCondaPath, PLATFORM, ARCH } = require('./utils');
const fs = require('fs');
const path = require('path');

let CONDA_DOWNLOAD_PREFIX = 'https://repo.anaconda.com/miniconda';
if (process.env.BOA_TUNA) {
  CONDA_DOWNLOAD_PREFIX = 'https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda';
}
if (process.env.BOA_CONDA_MIRROR) {
  CONDA_DOWNLOAD_PREFIX = process.env.BOA_CONDA_MIRROR;
}

const CONDA_LOCAL_PATH = initAndGetCondaPath();
let condaDownloadName = process.env.CONDA_PACKAGE_NAME || 'Miniconda3-4.7.12.1';

if (PLATFORM === 'linux') {
  condaDownloadName += '-Linux';
} else if (PLATFORM === 'darwin') {
  condaDownloadName += '-MacOSX';
} else {
  throw new TypeError(`No support for your platform ${PLATFORM}`);
}

if (ARCH === 'x64') {
  condaDownloadName += '-x86_64';
} else if (ARCH === 'ppc64') {
  condaDownloadName += '-ppc64le';
} else if (PLATFORM !== 'darwin') {
  condaDownloadName += '-x86';
}
condaDownloadName = `${condaDownloadName}.sh`;

// download it if not exists.
if (!fs.existsSync(condaDownloadName)) {
  run(`curl ${CONDA_DOWNLOAD_PREFIX}/${condaDownloadName} > ${condaDownloadName}`);
}

// check if ./bin/python exists, if not then install it.
if (!fs.existsSync(path.join(CONDA_LOCAL_PATH, 'bin', 'python'))) {
  run('rm', `-rf ${CONDA_LOCAL_PATH}`);
  run('sh', `./${condaDownloadName}`, `-f -b -p ${CONDA_LOCAL_PATH}`);
}

// cleanup the standard libs.
if (PLATFORM === 'darwin') {
  run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libc++*`);
} else if (PLATFORM === 'linux') {
  run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libstdc++.so*`);
  run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libgcc_s.so*`);
}

// dump info
py(`${CONDA_LOCAL_PATH}/bin/conda`, 'info -a');
