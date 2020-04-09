const fse = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const spinner = ora();
const { constants } = require('@pipcook/pipcook-core');

/**
 * prepare a working dir for developer to develop plugins
 */
const devPlugin = (cmdObj) => {
  const pluginType = cmdObj && cmdObj[0];
  let projectName = cmdObj && cmdObj[1];

  if (!pluginType) {
    console.log('Please provide a plugin type');
    return;
  }

  if (constants.PLUGINS.indexOf(pluginType) < 0) {
    console.warn(chalk.red(`Unsupported plugin type: "${pluginType}", it must be one of: \n${constants.PLUGINS.join(',\n')}`));
    return;
  }

  if (!projectName) {
    projectName = 'template-plugin';
  }

  let dirname;
  try {
    dirname = path.join(process.cwd(), projectName);
    if (fse.existsSync(dirname)) {
      spinner.fail(`a directory or file called ${projectName} already exists. Please use a new working directory`);
      return;
    }
    fse.ensureDirSync(path.join(dirname, 'src'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', '.npmignore'), 
      path.join(dirname, '.npmignore'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'package.json'), 
      path.join(dirname, 'package.json'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'tsconfig.json'), 
      path.join(dirname, 'tsconfig.json'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'src', `${pluginType}.ts`), 
      path.join(dirname, 'src', `index.ts`));
    console.log('success');
  } catch (e) {
    console.error(e);
    fse.removeSync(dirname);
  }
};

module.exports = devPlugin;
