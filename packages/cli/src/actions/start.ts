import { ChildProcess } from 'child_process';
import { StartHandler } from '../types';
import { listen, get } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';
import { ora, tail, parseConfigFilename } from '../utils';

const start: StartHandler = async (filename: string, opts: any) => {
  const spinner = ora();

  try {
    filename = await parseConfigFilename(filename);
  } catch (err) {
    spinner.fail(err.message);
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
