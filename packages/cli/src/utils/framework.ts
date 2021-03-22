import { fetchWithCache } from './cache';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';
import { PipelineMeta, PipcookFramework, constants, FrameworkDescFileName } from '@pipcook/core';
import { mirrorUrl } from './';

export const prepareFramework = async (
  pipelineMeta: PipelineMeta,
  frameworkDir: string,
  enableCache = true
): Promise<PipcookFramework> => {
  if (pipelineMeta.options.framework) {
    let realUrl = '';
    const urlObj = url.parse(pipelineMeta.options.framework);
    if ([ 'http:/', 'https:/', 'file:/' ].indexOf(urlObj.protocol) >= 0) {
      realUrl = pipelineMeta.options.framework;
    } else {
      realUrl = mirrorUrl(pipelineMeta.options.framework);
    }
    await fetchWithCache(
      constants.PIPCOOK_FRAMEWORK_PATH,
      realUrl,
      frameworkDir,
      enableCache
    );
    const framework = await fs.readJson(path.join(frameworkDir, FrameworkDescFileName));
    // todo: validate framework
    return {
      ...framework,
      path: frameworkDir
    };
  }
};
