import { ChildProcess } from 'child_process';
import { createGunzip } from 'zlib';
import { join } from 'path';
import tar from 'tar-stream';
import { ora, parseConfigFilename, cwd, tail } from "./utils";
import { tunaMirrorURI } from "./config";
import { route } from "./router";
import { listen, get, getFile } from "./request";
import { remove, createWriteStream, mkdirp } from 'fs-extra';

export async function install(filename: string, opts: any): Promise<void> {
  const spinner = ora();

  try {
    filename = await parseConfigFilename(filename);
  } catch (err) {
    spinner.fail(err.message);
    return process.exit(1);
  }
  const params = {
    cwd: cwd(),
    config: filename,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  if (!opts.verbose) {
    get(`${route.pipeline}/install`, params);
    spinner.succeed(`install plugins succeeded.`);
    return;
  } else {
    return new Promise((resolve, reject) => {
      listen(`${route.pipeline}/install`, params, {
        'info': (e: MessageEvent) => {
          const { name, version } = JSON.parse(e.data);
          spinner.start(`installing plugin ${name}@${version}`);
        },
        'installed': (e: MessageEvent) => {
          const { name, version } = JSON.parse(e.data);
          spinner.succeed(`plugin (${name}@${version}) is installed`);
        },
        'error': (e: MessageEvent) => {
          spinner.fail(`occurrs an error ${e.data}`);
          reject(new TypeError(e.data));
        },
        'finished': () => {
          spinner.succeed('all plugins installed');
          resolve();
        }
      });
    });
  }
}

export async function run(filename: string, opts: any): Promise<void> {
  const spinner = ora();
  const cwd = process.cwd();

  spinner.start('start running the pipeline...');
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

        const outputRootPath = join(cwd, opts.output || 'output');
        // remove the output dir
        await remove(outputRootPath);

        // generate output
        const extract = tar.extract();
        extract.on('entry', async (header, stream, next) => {
          const dist = join(outputRootPath, header.name);
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
}
