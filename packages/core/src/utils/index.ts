import * as url from 'url';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs-extra';
import { customAlphabet } from 'nanoid';
import { PIPCOOK_TMPDIR } from '../constants';
import * as seed from 'seedrandom';

export * as Script from './script';

const request = require('request');
const targz = require('targz');
const extract = require('extract-zip');

const { pipeline } = require('stream');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);
const compressAsync = promisify(targz.compress);
const extractAsync = promisify(extract);

export const pipelineAsync = promisify(pipeline);

/**
 * download the file and stored in specified directory
 * @param url: url of the file
 * @param fileName: full path of file that will be stored
 */
export async function download(url: string, fileName: string): Promise<void> {
  await fs.ensureFile(fileName);
  return pipelineAsync(request.get(url), fs.createWriteStream(fileName));
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
      const tmpPath = path.join(PIPCOOK_TMPDIR, this.generateId());
      await this.download(resUrl, tmpPath);
      await this.unZipData(tmpPath, targetDir);
      await fs.remove(tmpPath);
    } else {
      await this.download(resUrl, targetDir);
    }
  } else {
    throw new TypeError(`[${extname}] file format is not supported.`);
  }
}

export function compressTarFile(sourcePath: string, targetPath: string): Promise<void> {
  return compressAsync({ src: sourcePath, dest: targetPath });
}

/**
 * unzip compressed data
 * @param filePath: path of zip
 * @param targetPath: target full path
 */
export function unZipData(filePath: string, targetPath: string): Promise<void> {
  return extractAsync(filePath, { dir: targetPath });
}

/**
 * Shuffles array in place. ES6 version. This method is based on Fisher-Yates shuffle algorithm
 * @param array An array containing the items.
 */
export function shuffle(array: any[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ array[i], array[j] ] = [ array[j], array[i] ];
  }
}

/**
 * generate id
 */
export function generateId(): string {
  return nanoid();
}

/**
 * seedrandom
 */
export const seedrandom = seed;
