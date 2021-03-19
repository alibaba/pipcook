import { fetchWithCache } from './cache';
import * as fs from 'fs-extra';
import * as path from 'path';

import { PipelineMeta, PipcookFramework, constants, FrameworkDescFileName } from '@pipcook/core';

export const prepareFramework = async (
  pipelineMeta: PipelineMeta,
  frameworkDir: string,
  enableCache = true
): Promise<PipcookFramework> => {
  if (pipelineMeta.options.framework) {
    await fetchWithCache(
      constants.PIPCOOK_FRAMEWORK_PATH,
      pipelineMeta.options.framework,
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
