import ora from 'ora';
import { existsSync } from 'fs';
import * as path from 'path';
import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { startJob } from '../service/job';
import { StartHandler } from '../types';
import { Constants } from '../utils';

const spinner = ora();

function tail(id: string, name: string): ChildProcess {
  return spawn('tail',
    [
      '-f',
      `${Constants.PIPCOOK_HOME}/components/${id}/logs/${name}.log`
    ],
    {
      stdio: 'inherit'
    }
  );
}

const start: StartHandler = async (filename: string, verbose: boolean) => {
  if (!filename) {
    spinner.fail('Please specify the config path');
    return process.exit(1);
  }

  filename = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
  if (!existsSync(filename)) {
    spinner.fail(`${filename} not exists`);
    return process.exit(1);
  }

  const job = await startJob(filename, process.cwd());
  spinner.succeed(`create job ${job.id} succeeded`);
  if (verbose === true) {
    tail(job.id, 'stdout');
    tail(job.id, 'stderr');
  }
};

export default start;
