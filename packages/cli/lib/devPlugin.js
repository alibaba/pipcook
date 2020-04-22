const fse = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const { debugLog, debugWarning } = require('./debug');
const spinner = ora();
const { constants } = require('@pipcook/pipcook-core');

/**
 * prepare a working dir for developer to develop plugins
 */
const devPlugin = (cmdObj) => {
  const pluginType = cmdObj && cmdObj[0];
  let projectName = cmdObj && cmdObj[1];

  if (!pluginType) {
    debugLog('Please provide a plugin type');
    return;
  }

  if (!constants.PLUGINS.includes(pluginType)) {
    debugWarning(
      chalk.red(
        `Unsupported plugin type: "${pluginType}", it must be one of: \n${constants.PLUGINS.join(
          ',\n'
        )}`
      )
    );
    return;
  }

  if (!projectName) {
    projectName = 'template-plugin';
  }

  let dirname;
  try {
    dirname = path.join(process.cwd(), projectName);
    if (fse.existsSync(dirname)) {
      spinner.fail(
        `a directory or file called ${projectName} already exists. Please use a new working directory`
      );
      return;
    }
    fse.ensureDirSync(path.join(dirname, 'src'));
    fse.copyFileSync(
      path.join(__dirname, '..', 'assets', 'pluginPackage', 'package.json'),
      path.join(dirname, 'package.json')
    );
    fse.copyFileSync(
      path.join(__dirname, '..', 'assets', 'pluginPackage', 'tsconfig.json'),
      path.join(dirname, 'tsconfig.json')
    );
    fse.copyFileSync(
      path.join(
        __dirname,
        '..',
        'assets',
        'pluginPackage',
        'src',
        `${pluginType}.ts`
      ),
      path.join(dirname, 'src', `index.ts`)
    );
    debugLog('success');
  } catch (e) {
    debugLog(e);
    fse.removeSync(dirname);
  }
};

module.exports = devPlugin;
