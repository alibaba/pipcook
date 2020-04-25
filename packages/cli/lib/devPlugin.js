const fse = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const spinner = ora();
const { constants } = require('@pipcook/pipcook-core');

/**
 * prepare a working dir for developer to develop plugins
 */
const devPlugin = ({ type, name }) => {
  if (!type) {
    console.log('Please provide a plugin type');
    return;
  }
  if (!constants.PLUGINS.includes(type)) {
    console.warn(chalk.red(`Unsupported plugin type: "${type}", it must be one of: \n${constants.PLUGINS.join(',\n')}`));
    return;
  }

  if (!name) {
    name = 'template-plugin';
  }
  let dirname;
  try {
    dirname = path.join(process.cwd(), name);
    if (fse.existsSync(dirname)) {
      spinner.fail(`a directory or file called ${name} already exists. Please use a new working directory`);
      return;
    }
    fse.ensureDirSync(path.join(dirname, 'src'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'package.json'), 
      path.join(dirname, 'package.json'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'tsconfig.json'), 
      path.join(dirname, 'tsconfig.json'));
    fse.copyFileSync(path.join(__dirname, '..', 'assets', 'pluginPackage', 'src', `${type}.ts`), 
      path.join(dirname, 'src', `index.ts`));
    console.log('success');
  } catch (e) {
    console.error(e);
    fse.removeSync(dirname);
  }
};

module.exports = devPlugin;
