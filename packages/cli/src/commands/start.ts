import { fork } from 'child_process';
import ora from 'ora';
import path from 'path';
import { existsSync } from 'fs';

import { StartHandler } from '../types';

const spinner = ora();

export const start: StartHandler = async (filename: string) => {
  if (!filename) {
    spinner.fail('Please specify the config path');
    return process.exit(1);
  }

  if (!existsSync(filename)) {
    spinner.fail(`${filename} not exists`);
    return process.exit(1);
  }

  const script = path.join(__dirname, '../../dist/commands/runConfig.js');
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
