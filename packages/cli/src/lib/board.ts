import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import childProcess from 'child_process';
import path from 'path';
import { CMDHandler } from '../types';

const spinner = ora();

export const board: CMDHandler = async () => {
  try {
    if (!fse.existsSync(path.join(process.cwd(), '.server'))) {
      spinner.fail('Please init the project firstly');
      return;
    }

    childProcess.execSync(`cd .server && npm run dev`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  
  } catch (e) {
    console.error(chalk.red(e));
  }
};
