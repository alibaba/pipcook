'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { BOA_CONDA_PREFIX, BOA_TUNA } = process.env;
const CONDA_INSTALL_DIR = path.join(__dirname, '../.CONDA_INSTALL_DIR');
let { BOA_CONDA_INDEX, BOA_PYTHON_VERSION } = process.env;

// Specify BOA_TUNA for simplifying the env setup.
if (BOA_TUNA && !BOA_CONDA_INDEX) {
  BOA_CONDA_INDEX = 'https://pypi.tuna.tsinghua.edu.cn/simple';
}

// run a command
exports.run = (...args) => {
  const cmd = args.join(' ');
  console.log(`sh "${cmd}"`);
  return execSync.call(null, cmd, { stdio: 'inherit' })
};

// get the platform
exports.PLATFORM = os.platform();

// get the os arch
exports.ARCH = os.arch();

// get the conda path
exports.getCondaPath = function getCondaPath() {
  const condaDir = fs.readFileSync(CONDA_INSTALL_DIR, 'utf8');
  return path.resolve(__dirname, '..', condaDir);
};

// get the python version, it reads BOA_PYTHON_VERSION from env firstly.
exports.getPythonVersion = function getPythonVersion() {
  // TODO(Yorkie): fetch the default python version from conda or other sources.
  return BOA_PYTHON_VERSION || '3.7m';
};

// get the path of the python headers.
exports.getPythonHeaderPath = function getPythonHeaderPath() {
  return `${this.getCondaPath()}/include/python${this.getPythonVersion()}`;
};

// prints the conda path.
exports.printCondaPath = () => console.log(this.getCondaPath());

// initializes the conda and returns the path of conda.
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

// executes a python script from nodejs.
exports.py = (...args) => {
  const { run, getCondaPath } = exports;
  const CONDA_LOCAL_PATH = getCondaPath();
  const Python = path.join(CONDA_LOCAL_PATH, 'bin/python');
  const cmds = [Python].concat(args);
  return run(...cmds);
};

// executes a pip command from nodejs.
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
