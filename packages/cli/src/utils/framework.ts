import { fetchWithCache } from './cache';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';
import { PipelineMeta } from '@pipcook/core';
import { PipcookFramework } from '@pipcook/costa';
import * as constants from '../constants';
import { mirrorUrl, DownloadProtocol, unZipData } from './';

export const prepareFramework = async (
  pipelineMeta: PipelineMeta,
  frameworkDir: string,
  mirror: string,
  enableCache = true
): Promise<PipcookFramework> => {
  if (pipelineMeta.options.framework) {
    const urlObj = url.parse(pipelineMeta.options.framework);
    if (urlObj.protocol === DownloadProtocol.FILE) {
      if (path.extname(urlObj.path) === '.zip') {
        await unZipData(urlObj.path, frameworkDir);
      } else {
        await fs.copy(urlObj.path, frameworkDir);
      }
    } else {
      let realUrl = '';
      if (urlObj.protocol === DownloadProtocol.HTTP || urlObj.protocol === DownloadProtocol.HTTPS) {
        realUrl = pipelineMeta.options.framework;
      } else {
        realUrl = mirrorUrl(mirror, pipelineMeta.options.framework);
      }
      await fetchWithCache(
        constants.PIPCOOK_FRAMEWORK_PATH,
        realUrl,
        frameworkDir,
        enableCache
      );
    }
    const framework = await fs.readJson(path.join(frameworkDir, constants.FrameworkDescFilename));
    // todo: validate framework
    return {
      ...framework,
      path: frameworkDir
    };
  }
};
