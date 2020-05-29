'use strict';

const { run, CONDA_DOWNLOAD_NAME, CONDA_INSTALL_DIR } = require('./utils');
const fs = require('fs');

if (fs.existsSync(CONDA_DOWNLOAD_NAME)) {
  run('rm', `-f ./${CONDA_DOWNLOAD_NAME}`);
}
  
if (fs.existsSync(CONDA_INSTALL_DIR)) {
  run('rm', `-rf \`cat ${CONDA_INSTALL_DIR}\``);
  run('rm', `-f ${CONDA_INSTALL_DIR}`);
}
