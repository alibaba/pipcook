'use strict';

const { run, initAndGetCondaPath, CONDA_DOWNLOAD_NAME } = require('./utils');
const fs = require('fs');
const path = require('path');

let CONDA_DOWNLOAD_PREFIX = 'https://repo.anaconda.com/miniconda';
if (process.env.BOA_CONDA_MIRROR) {
  CONDA_DOWNLOAD_PREFIX = process.env.BOA_CONDA_MIRROR;
}

const CONDA_LOCAL_PATH = initAndGetCondaPath();

if (!fs.existsSync(CONDA_DOWNLOAD_NAME)) {
  run(`curl ${CONDA_DOWNLOAD_PREFIX}/${CONDA_DOWNLOAD_NAME} > ${CONDA_DOWNLOAD_NAME}`);
}

if (!fs.existsSync(path.join(CONDA_LOCAL_PATH, 'bin', 'python'))) {
  run('rm', `-rf ${CONDA_LOCAL_PATH}`);
  run('sh', `./${CONDA_DOWNLOAD_NAME}`, `-f -b -p ${CONDA_LOCAL_PATH}`);
  run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libstdc++.so*`);
  run('rm', `-rf ${CONDA_LOCAL_PATH}/lib/libgcc_s.so*`);
}

// dump info
run(`${CONDA_LOCAL_PATH}/bin/conda`, 'info -a');
