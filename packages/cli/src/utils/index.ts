import * as url from 'url';
import {
  exec,
  ExecOptions,
  ExecException
} from 'child_process';
import * as tar from 'tar-stream';
import { createGunzip } from 'zlib';
import { pathExists, mkdirp, createWriteStream } from 'fs-extra';
import * as path from 'path';
import realOra = require('ora');

export const cwd = process.cwd;

export function execAsync(cmd: string, opts?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException, stdout: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
  });
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

export async function streamToJson(stream: NodeJS.ReadStream): Promise<any> {
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

