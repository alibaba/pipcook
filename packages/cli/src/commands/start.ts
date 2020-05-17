import ora from 'ora';
import { existsSync } from 'fs';

import { startJob } from '../service/job';
import { StartHandler } from '../types';
import { fetchLog } from './job';

const spinner = ora();

export const start: StartHandler = async (filename: string, verbose: boolean) => {
  if (!filename) {
    spinner.fail('Please specify the config path');
    return process.exit(1);
  }

  if (!existsSync(filename)) {
    spinner.fail(`${filename} not exists`);
    return process.exit(1);
  }
  const data = await startJob(filename);
  spinner.succeed(`create job ${data.id} succeeded`);
  if (verbose === true) {
    fetchLog(data, '');
  }
};
