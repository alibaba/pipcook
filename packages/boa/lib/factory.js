'use strict';

const fs = require('fs');
const path = require('path');
const { Python } = require('bindings')('boa');

// read the conda path from the .CONDA_INSTALL_DIR
// eslint-disable-next-line no-sync
const condaPath = fs.readFileSync(path.join(__dirname, '../.CONDA_INSTALL_DIR'), 'utf8');
if (!process.env.PYTHONHOME) {
  process.env.PYTHONHOME = condaPath;
}

// create the global-scoped instance
let pyInst = global.__pipcook_boa_pyinst__;
if (pyInst == null) {
  pyInst = new Python(process.argv.slice(1));
  global.__pipcook_boa_pyinst__ = pyInst;
}

// FIXME(Yorkie): move to costa or daemon?
const globals = pyInst.globals();
const builtins = pyInst.builtins();

module.exports = {
  condaPath,
  pyInst,
  globals,
  builtins,
};
