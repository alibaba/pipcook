'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { BOA_CONDA_PREFIX, BOA_CONDA_INDEX } = process.env;

exports.CONDA_INSTALL_DIR = path.join(__dirname, '../.CONDA_INSTALL_DIR');
exports.run = (...args) => execSync.call(null, args.join(' '), { stdio: 'inherit' });
exports.PLATFORM = os.platform();
exports.ARCH = os.arch();

let condaDownloadName = 'Miniconda3-latest';
if (this.PLATFORM === 'linux') {
  condaDownloadName += '-Linux';
} else if (this.PLATFORM === 'darwin') {
  condaDownloadName += '-MacOSX';
} else {
  throw new TypeError(`No support for your platform ${this.PLATFORM}`);
}
if (this.ARCH === 'x64') {
  condaDownloadName += '-x86_64';
} else if (this.PLATFORM !== 'darwin') {
  condaDownloadName += '-x86';
}
exports.CONDA_DOWNLOAD_NAME = `${condaDownloadName}.sh`;

exports.getCondaPath = () => fs.readFileSync(this.CONDA_INSTALL_DIR, 'utf8');
exports.printCondaPath = () => console.log(this.getCondaPath());
exports.initAndGetCondaPath = () => {
  let condaPath;
  if (BOA_CONDA_PREFIX === '@cwd' || !BOA_CONDA_PREFIX) {
    condaPath = path.join(process.cwd(), '.miniconda');
  } else if (BOA_CONDA_PREFIX === '@package') {
    condaPath = path.join(__dirname, '../.miniconda');
  } else {
    condaPath = path.join(BOA_CONDA_PREFIX, '.miniconda');
  }
  fs.writeFileSync(this.CONDA_INSTALL_DIR, condaPath, 'utf8');
  return condaPath;
};

exports.pip = (...args) => {
  const { run, getCondaPath } = exports;
  const CONDA_LOCAL_PATH = getCondaPath();
  const PIP = path.join(CONDA_LOCAL_PATH, 'bin/pip');
  const cmds = [PIP].concat(args);
  if (BOA_CONDA_INDEX) {
    cmds.push(`-i ${BOA_CONDA_INDEX}`);
  }
  return run.apply(this, cmds);
};
