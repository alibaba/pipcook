'use strict';

const { run, CONDA_DOWNLOAD_NAME, CONDA_INSTALL_DIR } = require('./utils');
const fs = require('fs');

let CONDA_DOWNLOAD_PREFIX = 'https://repo.anaconda.com/miniconda';
if (process.env.BOA_CONDA_MIRROR) {
  CONDA_DOWNLOAD_PREFIX = process.env.BOA_CONDA_MIRROR;
}

if (fs.existsSync(CONDA_DOWNLOAD_NAME)) {
  run('rm', `-f ./${CONDA_DOWNLOAD_NAME}`);
}
  
if (fs.existsSync(CONDA_INSTALL_DIR)) {
  run('rm', `-rf \`cat ${CONDA_INSTALL_DIR}\``);
  run('rm', `-f ${CONDA_INSTALL_DIR}`);
}
