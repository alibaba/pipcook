import {
  exec,
  ExecOptions,
  ExecException
} from 'child_process';
import * as fs from 'fs-extra';
import * as CliProgress from 'cli-progress';
import * as path from 'path';
import * as request from 'request';
import realOra = require('ora');
import { constants, generateId, pipelineAsync, unZipData } from '@pipcook/core';
export * as Script from './script';
export * as Plugin from './plugin';
export * as Cache from './cache';
export * as Framework from './framework';
import * as os from 'os';
import * as url from 'url';
import * as boa from '@pipcook/boa';
import { promisify } from 'util';
const download = require('download-git-repo');

/**
 * promisify download from git
 */
export const downloadFromGit = promisify(download);

export function execAsync(cmd: string, opts?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException | null, stdout: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * download the file and stored in specified directory
 * @param url: url of the file
 * @param fileName: full path of file that will be stored
 */
export async function downloadWithProgress(url: string, fileName: string): Promise<void> {
  await fs.ensureFile(fileName);
  const bar = new CliProgress.SingleBar({
    format: '{bar} {percentage}% {value}MB/{total}MB'
  }, CliProgress.Presets.shades_classic);
  const file = fs.createWriteStream(fileName);
  let receivedBytes = 0;
  const downloadStream = request.get(url)
    .on('response', (response: any) => {
      const totalBytes = response.headers['content-length'];
      bar.start(Number((totalBytes / 1024 / 1024).toFixed(1)), 0);
    })
    .on('data', (chunk: any) => {
      receivedBytes += chunk.length;
      bar.update(Number((receivedBytes / 1024 / 1024).toFixed(1)));
    });
  try {
    await pipelineAsync(downloadStream, file);
    bar.stop();
  } catch (err) {
    fs.unlink(fileName);
    bar.stop();
    throw err;
  }
}

/**
 * Download the dataset from specific URL and extract to a generated path as the returned value.
 * @param resUrl the resource url, support http://, https://, file://.
 * @param targetDir the directory to save the files
 */
export async function downloadAndExtractTo(resUrl: string, targetDir: string): Promise<void> {
  const { protocol, pathname } = url.parse(resUrl);
  if (!protocol || !pathname) {
    throw new TypeError('invalid url');
  }
  const filename = path.basename(pathname);
  const extname = path.extname(filename);
  if (protocol === 'file:') {
    if (extname === '.zip') {
      await unZipData(pathname, targetDir);
    } else {
      await fs.copy(pathname, targetDir);
    }
  } else if (protocol === 'http:' || protocol === 'https:') {
    if (extname === '.zip') {
      const tmpPath = path.join(constants.PIPCOOK_TMPDIR, generateId());
      await this.downloadWithProgress(resUrl, tmpPath);
      await unZipData(tmpPath, targetDir);
      await fs.remove(tmpPath);
    } else {
      await this.downloadWithProgress(resUrl, targetDir);
    }
  } else {
    throw new TypeError(`[${extname}] file format is not supported.`);
  }
}

/**
 * Format datetime to string `yyyyMMddhhmmss`.
 * @param date datetime
 */
export function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDay();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  function fillZero(i: number): string {
    return i < 10 ? '0' + i : i.toString();
  }
  return `${year}${fillZero(month)}${fillZero(day)}${fillZero(hour)}${fillZero(min)}${fillZero(sec)}`;
}

/**
 * Construct mirror url by mirror and framework name.
 * @param mirror The url which includes node<nodeVersion>_py<pythonVersion>
 * @param framework The framework name witch version, like `tfjs-mobilenet@v1`
 */
export const mirrorUrl = (mirror: string, framework: string): string => {
  let pyVersion: string = boa.import('platform').python_version();
  const semver = pyVersion.split('.');
  pyVersion = `py${semver[0]}${semver[1]}`;
  const nodeVersion = `node${process.versions.node.substr(0, process.versions.node.indexOf('.'))}`;
  return url.resolve(
    mirror || constants.PIPCOOK_FRAMEWORK_MIRROR_BASE,
    `${nodeVersion}-${pyVersion}/${encodeURIComponent(framework)}-${os.platform()}-${os.arch()}-v${process.versions.napi}.zip`
  );
};

interface Logger {
  success(message: string): void;
  fail(message: string, exit: boolean, code: number): void;
  info(message: string): void;
  warn(message: string): void;
}

export class TtyLogger implements Logger {
  spinner: realOra.Ora;

  constructor() {
    this.spinner = realOra({ stream: process.stdout });
  }

  success(message: string): void {
    this.spinner.succeed(message);
  }

  fail(message: string, exit = true, code = 1): void {
    this.spinner.fail(message);
    if (exit) {
      process.exit(code);
    }
  }

  info(message: string): void {
    this.spinner.info(message);
  }

  warn(message: string): void {
    this.spinner.warn(message);
  }

  start(message: string): void {
    this.spinner.start(message);
  }
}

export class DefaultLogger implements Logger {
  success(message: string): void {
    console.log('[success]: ' + message);
  }

  fail(message: string, exit = true, code = 1): void {
    console.error('[fail]: ' + message);
    if (exit) {
      process.exit(code);
    }
  }

  info(message: string): void {
    console.log('[info]: ' + message);
  }

  warn(message: string): void {
    console.warn('[warn]: ' + message);
  }

  start(message: string): void {
    console.log('[start]: ' + message);
  }
}

const { rows, columns, isTTY } = process.stdout;
export const logger = isTTY && rows > 0 && columns > 0 ? new TtyLogger() : new DefaultLogger();
