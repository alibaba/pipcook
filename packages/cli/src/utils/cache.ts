import * as core from '@pipcook/pipcook-core';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import Debug from 'debug';
const debug = Debug('cache');

/**
 * if the file or directory exists in cache, link to target, or fetch and cache it
 * @param cacheDir cache directory
 * @param url url to fetch
 * @param target target path
 * @param enableCache is cache enabled
 */
export const fetchWithCache = async (cacheDir: string, url: string, target: string, enableCache = true): Promise<void> => {
  const cachePath = path.join(cacheDir, crypto.createHash('md5').update(url).digest('hex'));
  debug('search cache from', cachePath);
  await fs.remove(target);
  if (enableCache) {
    if (await fs.pathExists(cachePath)) {
      await fs.symlink(cachePath, target);
      return;
    }
    debug('cache missed');
  }
  await fs.remove(cachePath);
  debug('download from url', url);
  await core.downloadAndExtractTo(url, cachePath);
  debug(`link ${cachePath} to ${target}`);
  await fs.symlink(cachePath, target);
};
