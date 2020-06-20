import { ChildProcess } from 'child_process';
import { createGunzip } from 'zlib';
import * as path from 'path';
import tar from 'tar-stream';
import { mkdirp, createWriteStream, remove } from 'fs-extra';
import { StartHandler } from '../types';
import { listen, get, getFile } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';
import { ora, tail, parseConfigFilename } from '../utils';

const start: StartHandler = async (filename: string, opts: any) => {
  const spinner = ora();
  const cwd = process.cwd();

  try {
    filename = await parseConfigFilename(filename);
  } catch (err) {
    spinner.fail(err.message);
    return process.exit(1);
  }

  const params = {
    cwd,
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
      'job finished': async (e: MessageEvent) => {
        const job = JSON.parse(e.data);
        spinner.succeed(`job(${job.id}) is finished with ${e.data}`);
        stdout?.kill();
        stderr?.kill();

        const outputRootPath = path.join(cwd, 'output');
        // remove the output dir
        await remove(outputRootPath);

        // generate output
        const extract = tar.extract();
        extract.on('entry', async (header, stream, next) => {
          const dist = path.join(outputRootPath, header.name);
          if (header.type === 'directory') {
            await mkdirp(dist);
          } else if (header.type === 'file') {
            stream.pipe(createWriteStream(dist));
          }
          stream.on('end', next);
          stream.resume();
        });
        (await getFile(`${route.job}/${job.id}/output.tar.gz`)).pipe(createGunzip()).pipe(extract);
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
