import fse from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import path from 'path';
import { promisify } from 'util';
import { constants } from '@pipcook/pipcook-core';

import { DevPluginCommandHandler } from '../types';

const spinner = ora();

/**
 * prepare a working dir for developer to develop plugins
 */
export const devPlugin: DevPluginCommandHandler = async ({ type, name }) => {
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
    const isDirExist = await promisify(fse.exists)(dirname);
    if (isDirExist) {
      spinner.fail(`a directory or file called ${name} already exists. Please use a new working directory`);
      return process.exit(1);
    }
    await fse.ensureDir(path.join(dirname, 'src'));
    await fse.copyFile(path.join(__dirname, '..', 'assets', 'pluginPackage', 'package.json'), 
      path.join(dirname, 'package.json'));
    await fse.copyFile(path.join(__dirname, '..', 'assets', 'pluginPackage', 'tsconfig.json'), 
      path.join(dirname, 'tsconfig.json'));
    await fse.copyFile(path.join(__dirname, '..', 'assets', 'pluginPackage', 'src', `${type}.ts`), 
      path.join(dirname, 'src', `index.ts`));
    console.log('success');
  } catch (e) {
    console.error(e);
    await fse.remove(dirname);
  }
};
