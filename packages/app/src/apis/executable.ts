import { join } from 'path';
import { pathExistsSync, readJSONSync } from 'fs-extra';
import { AppModule, PipelineNode } from '../compiler/pipelinegen';

type Manifest = {
  executable: boolean;
  pipelines: PipelineNode[];
};

const { cwd } = process;
const APP_MANIFEST = join(cwd(), '.pipcook/manifest.json');
let executable = false;
let manifest: Manifest = null;

if (pathExistsSync(APP_MANIFEST)) {
  manifest = readJSONSync(APP_MANIFEST);
  if (manifest.executable === true) {
    executable = true;
  }
}

function dynamicModelExports(module: AppModule, exports: any) {
  manifest?.pipelines.filter((pipeline) => {
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
