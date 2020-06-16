#!/usr/bin/env node

import program from 'commander';
import * as fs from 'fs-extra';
import { post } from '../request';
import { route } from '../router';

program
  .command('compile <script.ts>')
  .description('compile the PipApp Script.')
  .action(async (srcPath) => {
    console.log(srcPath);
    const src = await fs.readFile(srcPath, 'utf8');
    const resp = await post(`${route.app}/compile`, { src });
    console.log(resp.pipelines);
  });

program
  .command('train')
  .description('start training the configured PipApp Script.')
  .action(() => {
    // TODO
  });

program.parse(process.argv);
