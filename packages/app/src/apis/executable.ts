import { pathExistsSync, readJSONSync } from 'fs-extra';
import { join } from 'path';

const { cwd } = process;
const APP_MANIFEST = join(cwd(), '.pipcook/manifest.json');
let executable = false;
let manifest: any = null;

if (pathExistsSync(APP_MANIFEST)) {
  manifest = readJSONSync(APP_MANIFEST);
  if (manifest.executable === true) {
    executable = true;
  }
}

function dynamicModelExports(module: string, exports: any) {
  manifest?.pipelines.filter((pipeline: any) => {
    return pipeline.namespace.module === module;
  }).forEach((pipeline: any) => {
    exports[pipeline.signature] = require(join(cwd(), '.pipcook/models', pipeline.jobId));
  });
}

export {
  executable,
  manifest,
  dynamicModelExports
};
