import { provide, inject } from 'midway';
import { RunConfigI, generateId, constants as CoreConstants } from '@pipcook/pipcook-core';
import { compile, PipelineNode } from '@pipcook/app';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PipelineService } from './pipeline';
import { parseConfig } from '../runner/helper';

interface CompileResult {
  pipelines: PipelineNode[];
  executableSource: string;
}

@provide('appService')
export class AppService {

  @inject('pipelineService')
  PipelineService: PipelineService;

  async compile(source: string): Promise<CompileResult> {
    const appId = generateId();
    const projRoot = path.join(CoreConstants.PIPCOOK_APP, appId);
    const tsconfig = path.join(projRoot, 'tsconfig.json');

    await fs.ensureDir(projRoot);
    await fs.writeJSON(tsconfig, {
      compilerOptions: {
        outDir: './dist',
        rootDir: './src'
      },
      exclude: [
        'node_modules',
        'dist'
      ]
    });
    await fs.ensureDir(projRoot + '/src');
    await fs.writeFile(projRoot + '/src/index.ts', source);

    const ctx = await compile(projRoot + '/src/index.ts', tsconfig);
    const executableSource = await fs.readFile(projRoot + '/dist/index.js', 'utf8');
    await fs.remove(projRoot);

    // create pipelines
    await Promise.all(ctx.pipelines.map(async (pipeline) => {
      const data = await parseConfig(pipeline.config as RunConfigI);
      const newPipeline = await this.PipelineService.createPipeline(data);
      pipeline.id = newPipeline.id;
    }));
    return {
      pipelines: ctx.pipelines,
      executableSource
    };
  }
}
