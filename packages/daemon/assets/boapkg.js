'use strict';

const fs = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');
const { pipeline } = require('./metadata.json');

let condaInstallDir;
try {
  const boaMainScript = require.resolve('@pipcook/boa');
  const boaSrcPath = join(boaMainScript, '../../');
  condaInstallDir = fs.readFileSync(`${boaSrcPath}/.CONDA_INSTALL_DIR`, 'utf8');
  fs.accessSync(condaInstallDir);
} catch (err) {
  console.error(err);
  console.warn('no @pipcook/boa installed, just skip');
  return process.exit(0);
}

function _requirePluginPkg(name) {
  return require(pipeline[name] + '/package.json');
}

function installBoaPkg(config) {
  if (!config || !config.dependencies) {
    console.warn('skip installing boapkg, no valid config found.');
    return;
  }
  // TODO(yorkie): keep consistent with @pipcook/costa.
  for (let k in config.dependencies) {
    let name;
    const v = config.dependencies[k];
    if (v === '*') {
      name = k;
    } else if (v.startsWith('git+https://') === true) {
      name = v;
    } else {
      name = `${k}==${v}`;
    }
    execSync([
      `${condaInstallDir}/bin/pip`,
      'install',
      name,
      '--default-timeout=1000'
    ].join(' '), {
      stdio: 'inherit'
    });
  }
}

const modelDefPkg = _requirePluginPkg('modelDefine');
installBoaPkg(modelDefPkg.conda);

if (typeof pipeline.dataProcess === 'string') {
  const dataProcessPkg = _requirePluginPkg('dataProcess');
  installBoaPkg(dataProcessPkg.conda);
}
