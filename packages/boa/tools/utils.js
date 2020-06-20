'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { BOA_CONDA_PREFIX, BOA_CONDA_INDEX } = process.env;
const CONDA_INSTALL_DIR = path.join(__dirname, '../.CONDA_INSTALL_DIR');

exports.run = (...args) => execSync.call(null, args.join(' '), { stdio: 'inherit' });
exports.PLATFORM = os.platform();
exports.ARCH = os.arch();

exports.getCondaPath = () => fs.readFileSync(CONDA_INSTALL_DIR, 'utf8');
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
  fs.writeFileSync(CONDA_INSTALL_DIR, condaPath, 'utf8');
  return condaPath;
};

exports.py = (...args) => {
  const { run, getCondaPath } = exports;
  const CONDA_LOCAL_PATH = getCondaPath();
  const Python = path.join(CONDA_LOCAL_PATH, 'bin/python');
  const cmds = [Python].concat(args);
  return run(...cmds);
};

exports.pip = (...args) => {
  const { py, getCondaPath } = exports;
  const CONDA_LOCAL_PATH = getCondaPath();
  const PIP = path.join(CONDA_LOCAL_PATH, 'bin/pip');
  const cmds = [PIP].concat(args);
  if (BOA_CONDA_INDEX) {
    cmds.push(`-i ${BOA_CONDA_INDEX}`);
  }
  return py(...cmds);
};
