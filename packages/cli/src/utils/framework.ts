import { fetchWithCache } from './cache';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';
import { PipelineMeta, PipcookFramework, constants, FrameworkDescFileName, unZipData } from '@pipcook/core';
import { mirrorUrl } from './';

export const prepareFramework = async (
  pipelineMeta: PipelineMeta,
  frameworkDir: string,
  mirror: string,
  enableCache = true
): Promise<PipcookFramework> => {
  if (pipelineMeta.options.framework) {
    const urlObj = url.parse(pipelineMeta.options.framework);
    if (urlObj.protocol === 'file:') {
      if (path.extname(urlObj.path) === '.zip') {
        await unZipData(urlObj.path, frameworkDir);
      } else {
        await fs.copy(urlObj.path, frameworkDir);
      }
    } else {
      let realUrl = '';
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
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
    const framework = await fs.readJson(path.join(frameworkDir, FrameworkDescFileName));
    // todo: validate framework
    return {
      ...framework,
      path: frameworkDir
    };
  }
};
