#!/usr/bin/env node

import program from 'commander';
import { AppProject } from '../app';

program
  .command('compile <script.ts>')
  .description('compile the PipApp Script.')
  .action(async (srcPath) => {
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();
    await app.compileAndSave();

    const { pipelineIds } = app.manifest;
    console.info(`generated ${pipelineIds.length} pipelines, please click the following links to config them:`);
    pipelineIds.forEach((id: string) => {
      console.info(`(${id}) > http://localhost:6927/index.html#/pipeline/info?pipelineId=${id}`)
    });
  });

program
  .command('train <script.ts>')
  .description('start training the configured PipApp Script.')
  .action(async (srcPath) => {
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();

    const { pipelineIds } = app.manifest;
    pipelineIds.forEach((id: string) => {
      console.log('start running the pipeline', id);
    });
  });

program.parse(process.argv);
