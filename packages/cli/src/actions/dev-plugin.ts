import fse from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import { constants } from '@pipcook/pipcook-core';
import { DevPluginCommandHandler } from '../types';
import { logger } from '../utils';


/**
 * prepare a working dir for developer to develop plugins
 */
const devPlugin: DevPluginCommandHandler = async ({ type, name }) => {
  if (!type) {
    console.log('Please provide a plugin type');
    return process.exit(1);
  }
  if (!constants.PLUGINS.includes(type)) {
    console.warn(chalk.red(`Unsupported plugin type: "${type}", it must be one of: \n${constants.PLUGINS.join(',\n')}`));
    return process.exit(1);
  }

  if (typeof name !== 'string') {
    name = 'template-plugin';
  }
  let dirname;
  try {
    dirname = path.join(process.cwd(), name);
    if (fse.existsSync(dirname)) {
      return logger.fail(`a directory or file called ${name} already exists. Please use a new working directory`);
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

export default devPlugin;
