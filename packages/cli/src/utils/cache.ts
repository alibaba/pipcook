import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import Debug from 'debug';
import { downloadAndExtractTo } from '.';
const debug = Debug('cache');

/**
 * if the file or directory exists in cache, link to target, or fetch and cache it
 * @param cacheDir cache directory
 * @param url url to fetch
 * @param target target path
 * @param enableCache is cache enabled
 */
export const fetchWithCache = async (cacheDir: string, url: string, target: string, enableCache = true): Promise<void> => {
  const md5 = crypto.createHash('md5').update(url).digest('hex');
  const cachePath = path.join(cacheDir, md5);
  const cacheTmpPath = path.join(cacheDir, 'tmp', md5);
  debug('search cache from', cachePath);
  await fs.remove(target);
  if (enableCache) {
    if (await fs.pathExists(cachePath)) {
      await fs.copy(cachePath, target);
      return;
    }
    debug('cache missed');
  }
  await fs.remove(cachePath);
  await fs.remove(cacheTmpPath);
  debug('download from url', url);
  await downloadAndExtractTo(url, cacheTmpPath);
  debug('move tmp file to cache');
  await fs.move(cacheTmpPath, cachePath);
  debug(`copy ${cachePath} to ${target}`);
  await fs.copy(cachePath, target, );
};
