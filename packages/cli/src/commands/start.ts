import ora from 'ora';
import { exists } from 'fs';
import { promisify } from 'util';
import * as path from 'path';

import { startJob } from '../service/job';
import { StartHandler } from '../types';
import { fetchLog } from './job';

const spinner = ora();

export const start: StartHandler = async (filename: string, verbose: boolean) => {
  if (!filename) {
    spinner.fail('Please specify the config path');
    return process.exit(1);
  }

  filename = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
  const isFileExist = await promisify(exists)(filename);
  if (!isFileExist) {
    spinner.fail(`${filename} not exists`);
    return process.exit(1);
  }
  const data = await startJob(filename);
  spinner.succeed(`create job ${data.id} succeeded`);
  if (verbose === true) {
    fetchLog(data, '');
  }
};
