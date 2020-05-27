import ora from 'ora';
import { existsSync } from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { StartHandler } from '../types';
import { Constants } from '../utils';
import { listen, get } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';

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

const start: StartHandler = async (filename: string, opts: any) => {
  if (!filename) {
    spinner.fail('Please specify the config path');
    return process.exit(1);
  }

  filename = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
  if (!existsSync(filename)) {
    spinner.fail(`${filename} not exists`);
    return process.exit(1);
  }

  const params = {
    cwd: process.cwd(),
    config: filename,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  if (!opts.verbose) {
    const job = await get(`${route.job}/start`, params);
    spinner.succeed(`create job(${job.id}) succeeded.`);
  } else {
    let stdout: ChildProcess, stderr: ChildProcess;
    spinner.start(`start running ${filename}...`);
    await listen(`${route.job}/start`, params, {
      'job created': (e: MessageEvent) => {
        const job = JSON.parse(e.data);
        spinner.succeed(`create job(${job.id}) succeeded.`);
        stdout = tail(job.id, 'stdout');
        stderr = tail(job.id, 'stderr');
      },
      'job finished': (e: MessageEvent) => {
        const job = JSON.parse(e.data);
        spinner.succeed(`job(${job.id}) is finished with ${e.data}`);
        stdout?.kill();
        stderr?.kill();
      },
      'error': (e: MessageEvent) => {
        spinner.fail(`occurrs an error ${e.data}`);
        stdout?.kill();
        stderr?.kill();
        process.exit(1);
      }
    });
  }
};

export default start;
