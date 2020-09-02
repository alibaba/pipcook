import * as url from 'url';
import {
  exec,
  spawn,
  ChildProcess,
  ExecOptions,
  SpawnOptions,
  ExecException
} from 'child_process';
import tar from 'tar-stream';
import { createGunzip } from 'zlib';
import { pathExists, mkdirp, createWriteStream } from 'fs-extra';
import path from 'path';
import { constants as CoreConstants, PipelineStatus } from '@pipcook/pipcook-core';
import { PipcookClient } from '@pipcook/sdk';
import realOra = require('ora');

export const Constants = {
  BOA_CONDA_INDEX: 'https://pypi.tuna.tsinghua.edu.cn/simple',
  BOA_CONDA_MIRROR: 'https://mirrors.tuna.tsinghua.edu.cn/anaconda/miniconda'
};
export const cwd = process.cwd;

export let client: PipcookClient;

export function execAsync(cmd: string, opts?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException, stdout: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
  });
}

export function execNpm(subcmd: string, flags?: string, opts?: SpawnOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const cli = spawn('npm', [ subcmd, flags ], {
      stdio: 'inherit',
      env: process.env,
      ...opts
    });
    cli.on('exit', resolve);
    cli.on('error', reject);
  });
}

export function tail(id: string, name: string): ChildProcess {
  return spawn('tail',
    [
      '-f',
      `${CoreConstants.PIPCOOK_HOME_PATH}/components/${id}/logs/${name}.log`
    ],
    {
      stdio: 'inherit'
    }
  );
}

export async function parseConfigFilename(filename: string): Promise<url.UrlWithStringQuery> {
  if (!filename) {
    throw new TypeError('Please specify the config path');
  }
  let urlObj = url.parse(filename);
  // file default if the protocol is null
  if (urlObj.protocol == null) {
    filename = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
    // check the filename existence
    if (!await pathExists(filename)) {
      throw new TypeError(`${filename} not exists`);
    } else {
      urlObj = url.parse(`file://${filename}`);
    }
  } else if ([ 'http:', 'https:' ].indexOf(urlObj.protocol) === -1) {
    throw new TypeError(`protocol '${urlObj.protocol}' is not supported`);
  }
  return urlObj;
}
export async function streamToJson(stream: NodeJS.ReadStream): Promise<object> {
  return new Promise((resolve, reject) => {
    let jsonStr = '';
    stream.on('data', (chunk: any) => {
      jsonStr += chunk;
    });
    stream.on('error', (err) => {
      reject(err);
    });
    stream.on('end', () => {
      try {
        const jsonObj = JSON.parse(jsonStr);
        resolve(jsonObj);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * init and get the client
 * @param host host name or ip, default value is '127.0.0.1'
 * @param port port default 6927
 */
export function initClient(host = '127.0.0.1', port = 6927): PipcookClient {
  if (!client) {
    client = new PipcookClient(`http://${host}`, port);
  }
  return client;
}

export async function extractToPath(stream: NodeJS.ReadableStream, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const gunZip = createGunzip();
    extract.on('entry', async (header, stream, next) => {
      const dist = path.join(outputPath, header.name);
      if (header.type === 'directory') {
        await mkdirp(dist);
      } else if (header.type === 'file') {
        stream.pipe(createWriteStream(dist));
      }
      stream.on('end', next);
      stream.resume();
    });
    extract.on('error', (err) => {
      reject(err);
    });
    extract.on('finish', () => {
      resolve();
    });
    gunZip.on('error', (err) => {
      reject(err);
    });
    stream.pipe(gunZip).pipe(extract);
  });
}

interface Logger {
  success(message: string): void;
  fail(message: string, exit: boolean, code: number): void;
  info(message: string): void;
  warn(message: string): void;
}

class TtyLogger implements Logger {
  spinner: realOra.Ora;

  constructor() {
    this.spinner = realOra({ stream: process.stdout });
  }

  success(message: string) {
    this.spinner.succeed(message);
  }

  fail(message: string, exit = true, code = 1) {
    this.spinner.fail(message);
    if (exit) {
      process.exit(code);
    }
  }

  info(message: string) {
    this.spinner.info(message);
  }

  warn(message: string) {
    this.spinner.warn(message);
  }

  start(message: string) {
    this.spinner.start(message);
  }
}

class DefaultLogger implements Logger {
  success(message: string) {
    console.log('[success]: ' + message);
  }

  fail(message: string, exit = true, code = 1) {
    console.error('[fail]: ' + message);
    if (exit) {
      process.exit(code);
    }
  }

  info(message: string) {
    console.log('[info]: ' + message);
  }

  warn(message: string) {
    console.warn('[warn]: ' + message);
  }

  start(message: string) {
    console.log('[start]: ' + message);
  }
}

const { rows, columns, isTTY } = process.stdout;
export const logger = isTTY && rows > 0 && columns > 0 ? new TtyLogger() : new DefaultLogger();

export function traceLogger(event: string, data: any) {
  if (event === 'log') {
    if (data.level === 'info') {
      logger.info(data.data);
    } else if (data.level === 'warn') {
      logger.warn(data.data);
    }
  } else if (event === 'job_status') {
    if (data.jobStatus === PipelineStatus.PENDING) {
      logger.info(`[job] pending: ${data.queueLength}`);
    } else if (data.jobStatus === PipelineStatus.RUNNING) {
      logger.info(`[job] running${data.step ? ` ${data.step} ${data.stepAction}` : ''}`);
    } else if (data.jobStatus === PipelineStatus.FAIL) {
      logger.info('[job] fails');
    } else if (data.jobStatus === PipelineStatus.SUCCESS) {
      logger.info('[job] run successfully');
    }
  }
}
