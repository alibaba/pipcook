import { fork } from 'child_process';
import ora from 'ora';
import path from 'path';
import { existsSync } from 'fs';

import { CMDHandler } from '../types';

const spinner = ora();

export const start: CMDHandler = async (filename: string) => {
  if (!filename) {
    spinner.fail('Please specify the config path');
    return;
  }

  if (!existsSync(filename)) {
    spinner.fail(`${filename} not exists`);
    return;
  }

  const script = path.join(__dirname, 'runConfig.js');
  const child = fork(script, [ filename ], {
    cwd: process.cwd(),
    env: {
      NODE_PATH: path.join(process.cwd(), 'node_modules')
    },
    stdio: 'inherit'
  });
  child.on('exit', (code) => {
    process.exit(code);
  });
};
