#!/usr/bin/env node

import program from 'commander';
import * as fs from 'fs-extra';
import { post } from '../request';
import { route } from '../router';

program
  .command('compile <script.ts>')
  .description('compile the PipApp Script.')
  .action(async (srcPath) => {
    const src = await fs.readFile(srcPath, 'utf8');
    const { pipelines } = await post(`${route.app}/compile`, { src });
    console.info(`generated ${pipelines.length} pipelines, please click the following links to config them:`);
    pipelines.forEach((item: any) => {
      console.info(`(${item.id}) > http://localhost:6927/index.html#/pipeline/info?pipelineId=${item.id}`)
    });
  });

program
  .command('train')
  .description('start training the configured PipApp Script.')
  .action(() => {
    // TODO
  });

program.parse(process.argv);
