'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const CONDA_INSTALL_DIR = path.join(__dirname, '../.CONDA_INSTALL_DIR');
const CONDA_INSTALL_NAME = '.miniconda';

// Environment variables
let {
  /**
   * The prefix path for choosing the conda directory, possible values are:
   * - {\@package} represents a relative path to the boa installed package.
   * - {\@cwd}     represents a relative path to the current working directory it depends on shell.
   * - {string}    represents a absolute path to your installed conda path.
   * 
   * Note that, if the variable is specified with relative path, we will throw an error.
   */
  BOA_CONDA_PREFIX = '@package',
  /**
   * The boolean if installing from tuna mirror.
   * @boolean
   */
  BOA_TUNA,
  /**
   * The boolean if installing the conda.
   */
  BOA_FORCE_INSTALL,
  /**
   * The conda remote URL, default is https://repo.anaconda.com/miniconda.
   * @string
   */
  BOA_CONDA_REMOTE = 'https://repo.anaconda.com/miniconda',
  BOA_CONDA_MIRROR,
  /**
   * The conda version to download from remote URL.
   * @string
   */
  BOA_CONDA_VERSION = 'Miniconda3-4.7.12.1',
  /**
   * The conda index URI, if `BOA_TUNA` is specified, it will be set.
   * @string
   */
  BOA_CONDA_INDEX,
  /**
   * The python library version, for example 3.7m
   * @string
   */
  BOA_PYTHON_VERSION = '3.7m',
  /**
   * Install the base packages: numpy/scikit/...
   */
  BOA_PACKAGE_BASE,
  /**
   * Install the cv packages: opencv
   */
  BOA_PACKAGE_CV,
} = process.env;

// Check for BOA_CONDA_PREFIX, throw an TypeError when it's not a relative path.
if (!/\@(package|cwd)/.test(BOA_CONDA_PREFIX) && !path.isAbsolute(BOA_CONDA_PREFIX)) {
  throw new TypeError('BOA_CONDA_PREFIX is required to be an absolute path');
}

// aliases
if (typeof BOA_CONDA_MIRROR === 'string' && BOA_CONDA_MIRROR.length > 0) {
  BOA_CONDA_REMOTE = BOA_CONDA_MIRROR;
}

// Specify BOA_TUNA for simplifying the env setup.
if (BOA_TUNA) {
  BOA_CONDA_REMOTE = 'https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda';
  BOA_CONDA_INDEX = 'https://pypi.tuna.tsinghua.edu.cn/simple';
}

module.exports = {
  /**
   * Call to `os.platform()`.
   */
  PLATFORM: os.platform(),
  
  /**
   * Call to `os.arch()`
   */
  ARCH: os.arch(),

  /**
   * Compute the state if the build status should install conda.
   */
  shouldInstallConda() {
    if ('@package' === BOA_CONDA_PREFIX) {
      return true;
    }
    let expectedPath = BOA_CONDA_PREFIX;
    if (/^\@cwd/.test(expectedPath)) {
      expectedPath = expectedPath.replace('@cwd', process.cwd());
    }
    if (!fs.existsSync(expectedPath)) {
      console.warn(`found the path(${expectedPath}) not exists, conda installation has been switched on.`);
      return true;
    }
    return false;
  },

  /**
   * Resolves the conda path by configs, then update it to the CONDA_INSTALL_DIR dot file, it returns
   * the resolved value.
   */
  resolveAndUpdateCondaPath() {
    let resolvedPrefix;
    if (BOA_CONDA_PREFIX === '@package') {
      resolvedPrefix = path.join(__dirname, '..');
    } else if (/^\@cwd/.test(BOA_CONDA_PREFIX)) {
      resolvedPrefix = (BOA_CONDA_PREFIX + '').replace('@cwd', process.cwd());
    } else {
      resolvedPrefix = BOA_CONDA_PREFIX;
    }
    const str = path.join(resolvedPrefix, CONDA_INSTALL_NAME);
    fs.writeFileSync(CONDA_INSTALL_DIR, str, 'utf8');
    return str;
  },

  /**
   * Return the conda remote URL.
   */
  getCondaRemote() {
    return BOA_CONDA_REMOTE;
  },

  /**
   * Get the conda directory absolute path.
   */
  getCondaPath() {
    if (!fs.existsSync(CONDA_INSTALL_DIR)) {
      throw new TypeError(`${CONDA_INSTALL_DIR} not found, please reinstall "@pipcook/boa".`);
    }
    const condaPath = fs.readFileSync(CONDA_INSTALL_DIR, 'utf8');
    if (!condaPath || !fs.existsSync(condaPath)) {
      this.run('rm', '-rf', CONDA_INSTALL_DIR);
      throw new TypeError(`invalid CONDA_INSTALL_DIR file, please reinstall "@pipcook/boa".`);
    }
    return condaPath;
  },

  /**
   * Return the complete conda URL to be downloaded the specific version.
   */
  getCondaDownloaderName() {
    let downloaderName = (BOA_CONDA_VERSION + '');
    // matches for platforms: linux/macos
    if (this.PLATFORM === 'linux') {
      downloaderName += '-Linux';
    } else if (this.PLATFORM === 'darwin') {
      downloaderName += '-MacOSX';
    } else {
      throw new TypeError(`no support for platform ${PLATFORM}`);
    }
    // matches for archs: x64/x86/ppc64/?
    if (this.ARCH === 'x64') {
      downloaderName += '-x86_64';
    } else if (this.ARCH === 'ppc64') {
      downloaderName += '-ppc64le';
    } else {
      if (this.PLATFORM !== 'darwin') {
        downloaderName += '-x86';
      }
    }
    return `${downloaderName}.sh`;
  },

  /**
   * Get the absolute path of the python library, this is used to compile with.
   */
  getPythonLibraryAbsPath() {
    return path.join(this.getCondaPath(), 'lib');
  },

  /**
   * Get the runpath/rpath of the python library, this is used to load dynamically.
   */
  getPythonLibraryRunPath() {
    if (BOA_CONDA_PREFIX === '@packages') {
      const prefix = PLATFORM === 'darwin' ? '@loader_path' : '$$ORIGIN';
      return `${prefix}/../../${CONDA_INSTALL_NAME}/lib`;
    } else {
      return this.getPythonLibraryAbsPath();
    }
  },

  /**
   * Returns if the python should be installed on the current prefix. To install the Python always,
   * set the `BOA_FORCE_INSTALL=1` to return false forcily.
   * @param {string} prefix 
   */
  shouldPythonInstalledOn(prefix) {
    if (BOA_FORCE_INSTALL) {
      return false;
    }
    return fs.existsSync(path.join(prefix, 'bin/python'));
  },

  /**
   * Get the Python version to be used by Boa.
   */
  getPythonVersion() {
    // TODO(Yorkie): fetch the default python version from conda or other sources.
    return BOA_PYTHON_VERSION;
  },

  /**
   * Get the path of Python headers.
   */
  getPythonHeaderPath() {
    return `${this.getCondaPath()}/include/python${this.getPythonVersion()}`;
  },

  /**
   * Install the Python packages by the BOA_PACKAGE_* variables.
   */
  installPythonPackages() {
    const packagesToInstall = [];
    if (BOA_PACKAGE_BASE) {
      packagesToInstall.push('numpy');
      packagesToInstall.push('scikit-learn');
    }
    if (BOA_PACKAGE_CV) {
      packagesToInstall.push('opencv-python');
    }
    for (let pkg of packagesToInstall) {
      this.pip('install', pkg, '--default-timeout=1000');
    }
  },

  /**
   * Execute a shell command.
   * @param  {...any} args 
   */
  run(...args) {
    const cmd = args.join(' ');
    console.info(`sh "${cmd}"`);
    return execSync.call(null, cmd, { stdio: 'inherit' });
  },

  /**
   * Execute a python command.
   * @param  {...any} args 
   */
  py(...args) {
    const python = path.join(this.getCondaPath(), 'bin/python');
    const cmds = [ python ].concat(args);
    return this.run(...cmds);
  },

  /**
   * Execute a pip command.
   * @param  {...any} args 
   */
  pip(...args) {
    const pip = path.join(this.getCondaPath(), 'bin/pip');
    const cmds = [ pip ].concat(args);
    if (BOA_CONDA_INDEX) {
      cmds.push(`-i ${BOA_CONDA_INDEX}`);
    }
    cmds.push('--timeout=5');
    return this.py(...cmds);
  },
};
