import {
  exec,
  ExecOptions,
  ExecException
} from 'child_process';
import * as fs from 'fs-extra';
import * as CliProgress from 'cli-progress';
import * as path from 'path';
import * as bent from 'bent';
import * as os from 'os';
import * as url from 'url';
import { promisify } from 'util';
import { customAlphabet } from 'nanoid';
import * as constants from '../constants';
import * as extract from 'extract-zip';
import * as realOra from 'ora';
import * as prettyBytes from 'pretty-bytes';
import * as dateformat from 'dateformat';

export * as Script from './script';
export * as Plugin from './plugin';
export * as Cache from './cache';
export * as Framework from './framework';
export * as PredictDataset from './predict-dataset';
export * as PostPredict from './post-predict';
export * as ServePredict from './serve-predict';

const { pipeline } = require('stream');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);

export const pipelineAsync = promisify(pipeline);

export const makeWorkspace = async (): Promise<string> => {
  const workspace = path.resolve('./pipcook-output');
  await fs.mkdirp(workspace);
  return workspace;
};

/**
 * download the file and stored in specified directory
 * @param url: url of the file
 * @param fileName: full path of file that will be stored
 */
export async function download(url: string, fileName: string): Promise<void> {
  await fs.ensureFile(fileName);
  const stream = await bent(url)('') as NodeJS.ReadableStream;
  return pipelineAsync(stream, fs.createWriteStream(fileName));
}

/**
 * unzip compressed data
 * @param filePath: path of zip
 * @param targetPath: target full path
 */
export function unZipData(filePath: string, targetPath: string): Promise<void> {
  return extract(filePath, { dir: targetPath });
}

/**
 * Fit model directory, if `model/model/pipeline.json` exists, move the subdirectory `model` to top level.
 * @param filePath: path of zip
 */
export async function fitModelDir(modelDir: string): Promise<void> {
  if (await fs.pathExists(path.join(modelDir, 'model', constants.PipelineFileInModelDir))) {
    await fs.move(path.join(modelDir, 'model'), `${modelDir}.tmp`);
    await fs.remove(modelDir);
    await fs.move(`${modelDir}.tmp`, modelDir);
  }
}

/**
 * generate id
 */
export function generateId(): string {
  return nanoid();
}

export enum DownloadProtocol { HTTP = 'http:', HTTPS = 'https:', FILE = 'file:' }

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
    format: '{bar} {percentage}% {value}/{total}',
    formatValue: (v, _, type): string => {
      if (type === 'value' || type === 'total') {
        return prettyBytes(v);
      } else {
        return v.toString();
      }
    }
  }, CliProgress.Presets.shades_classic);
  const file = fs.createWriteStream(fileName);
  let receivedBytes = 0;
  const downloadStream = (await bent(url)('')) as bent.NodeResponse;
  const totalBytes = downloadStream.headers['content-length'];
  bar.start(Number(totalBytes), 0);
  downloadStream.on('data', (chunk: any) => {
    receivedBytes += chunk.length;
    bar.update(receivedBytes);
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
      await this.unZipData(pathname, targetDir);
    } else {
      await fs.copy(pathname, targetDir);
    }
  } else if (protocol === 'http:' || protocol === 'https:') {
    if (extname === '.zip') {
      const tmpPath = path.join(constants.PIPCOOK_TMPDIR, this.generateId());
      await this.downloadWithProgress(resUrl, tmpPath);
      this.logger.start('extracting');
      await this.unZipData(tmpPath, targetDir);
      await fs.remove(tmpPath);
    } else {
      await this.downloadWithProgress(resUrl, targetDir);
    }
  } else {
    throw new TypeError(`[${extname}] file format is not supported.`);
  }
}

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

export const mirrorUrl = (mirror: string, framework: string): string => {
  const pyVersion = 'py37';
  const nodeVersion = `node${process.versions.node.substr(0, process.versions.node.indexOf('.'))}`;
  return url.resolve(
    mirror,
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
  private spinner: realOra.Ora;

  constructor() {
    this.spinner = realOra({
      stream: process.stdout,
      prefixText: (): string => dateformat(new Date(), '[hh:MM:ss:l]')
    });
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
