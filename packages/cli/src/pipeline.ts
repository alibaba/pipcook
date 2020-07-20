import { ChildProcess } from 'child_process';
import { createGunzip } from 'zlib';
import { join } from 'path';
import tar from 'tar-stream';
import { logger, parseConfigFilename, cwd, tail } from "./utils";
import { tunaMirrorURI } from "./config";
import { route } from "./router";
import { listen, get, getFile } from "./request";
import { remove, createWriteStream, mkdirp } from 'fs-extra';

export async function install(filename: string, opts: any): Promise<void> {
  try {
    filename = await parseConfigFilename(filename);
  } catch (err) {
    return logger.fail(err.message, 1);
  }
  const params = {
    cwd: cwd(),
    config: filename,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };

  if (!opts.verbose) {
    get(`${route.pipeline}/install`, params);
    logger.success(`install plugins succeeded.`);
    return;
  } else {
    return new Promise((resolve, reject) => {
      listen(`${route.pipeline}/install`, params, {
        'log': (e: MessageEvent) => {
          const { level, data } = JSON.parse(e.data);
          switch (level) {
          case 'info':
            logger.info(data);
            break;
          case 'warn':
            logger.warn(data);
            break;
          default:
            logger.info(data);
          }
        },
        'info': (e: MessageEvent) => {
          const { name, version } = JSON.parse(e.data);
          logger.start(`installing plugin ${name}@${version}`);
        },
        'installed': (e: MessageEvent) => {
          const { name, version } = JSON.parse(e.data);
          logger.success(`plugin (${name}@${version}) is installed`);
        },
        'error': (e: MessageEvent) => {
          logger.fail(`occurrs an error ${e.data}`);
          reject(new TypeError(e.data));
        },
        'finished': () => {
          logger.success('all plugins installed');
          resolve();
        }
      });
    });
  }
}

export async function run(filename: string, opts: any): Promise<void> {
  const cwd = process.cwd();

  logger.start('start running the pipeline...');
  try {
    filename = await parseConfigFilename(filename);
  } catch (err) {
    return logger.fail(err.message, 1);
  }

  const params = {
    cwd,
    config: filename,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  if (!opts.verbose) {
    const job = await get(`${route.job}/start`, params);
    logger.success(`create job(${job.id}) succeeded.`);
  } else {
    let stdout: ChildProcess, stderr: ChildProcess;
    await listen(`${route.job}/start`, params, {
      'job created': (e: MessageEvent) => {
        const job = JSON.parse(e.data);
        logger.success(`start running ${filename}...`);
        stdout = tail(job.id, 'stdout');
        stderr = tail(job.id, 'stderr');
      },
      'job finished': async (e: MessageEvent) => {
        const job = JSON.parse(e.data);
        logger.success(`job(${job.id}) is finished with ${e.data}`);
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
        logger.fail(`occurrs an error ${e.data}`);
        stdout?.kill();
        stderr?.kill();
        process.exit(1);
      }
    });
  }
}
