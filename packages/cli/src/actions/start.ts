import ora from 'ora';
import { existsSync } from 'fs';
import * as path from 'path';
import { ChildProcess } from 'child_process';
import { StartHandler } from '../types';
import { listen, get } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';
import { tail } from '../utils';
import * as url from 'url';

const start: StartHandler = async (filename: string, opts: any) => {
  const spinner = ora();

  if (!filename) {
    spinner.fail('Please specify the config path');
    return process.exit(1);
  }
  let urlObj = url.parse(filename);
  // file default if the protocol is null
  if (urlObj.protocol === null) {
    filename = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
    // check the filename existence
    if (!existsSync(filename)) {
      spinner.fail(`${filename} not exists`);
      return process.exit(1);
    } else {
      filename = url.parse(`file://${filename}`).href;
    }
  } else if ([ 'http:', 'https:' ].indexOf(urlObj.protocol) === -1) {
    spinner.fail(`protocol ${urlObj.protocol} is not supported`);
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
    await listen(`${route.job}/start`, params, {
      'job created': (e: MessageEvent) => {
        const job = JSON.parse(e.data);
        spinner.succeed(`start running ${filename}...`);
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
