import { provide, inject } from 'midway';
import { compile, PipelineGenContext } from '@pipcook/app';
import * as fs from 'fs-extra';
import * as path from 'path';
import { pseudoRandomBytes } from 'crypto';
import { PIPCOOK_APP_DIR } from '../utils/constants';
import { PipelineService } from './pipeline';
import { parseConfig } from '../runner/helper';
import { RunConfigI } from '@pipcook/pipcook-core';

@provide('AppService')
export class AppService {

  @inject('pipelineService')
  PipelineService: PipelineService;

  async compile(source: string): Promise<PipelineGenContext> {
    const appId = pseudoRandomBytes(8).toString('hex');
    const projRoot = path.join(PIPCOOK_APP_DIR, appId);
    const tsconfig = path.join(projRoot, 'tsconfig.json');

    await fs.ensureDir(projRoot);
    await fs.writeJSON(tsconfig, {
      'compilerOptions': {
        'outDir': './dist',
        'rootDir': './src'
      },
      'exclude': [
        'node_modules',
        'dist'
      ]
    });
    await fs.ensureDir(projRoot + '/src');
    await fs.writeFile(projRoot + '/src/index.ts', source);

    const ctx = compile(projRoot + '/src/index.ts', tsconfig);
    await fs.remove(projRoot);

    // create pipelines
    await Promise.all(ctx.pipelines.map(async (pipeline) => {
      const data = await parseConfig(pipeline.config as RunConfigI);
      const newPipeline = await this.PipelineService.createPipeline(data);
      pipeline.id = newPipeline.id;
    }));
    return ctx;
  }
}
