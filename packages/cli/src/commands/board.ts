import chalk from 'chalk';
import fse from 'fs-extra';
import ora from 'ora';
import childProcess from 'child_process';
import path from 'path';
import { CommandHandler } from '../types';

const spinner = ora();

export const board: CommandHandler = async () => {
  try {
    if (!fse.existsSync(path.join(process.cwd(), '.server'))) {
      spinner.fail('Please init the project firstly');
      return process.exit(1);
    }

    childProcess.execSync(`cd .server && npm run dev`, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  
  } catch (e) {
    console.error(chalk.red(e));
  }
};
