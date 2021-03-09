#!/usr/bin/env node

import * as semver from 'semver';
import * as chalk from 'chalk';
import * as program from 'commander';
import { join } from 'path';
import { readJson, mkdirp } from 'fs-extra';
import { StandaloneRuntime } from '../runtime';
import { logger } from '../utils';
export interface RunOptions {
  output: string;
  nocache: boolean;
  debug: boolean;
}

function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDay();
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  function fillZero(i: number): string {
    return i < 10 ? '0' + i : i.toString();
  }
  return `${year}${fillZero(month)}${fillZero(day)}${fillZero(hour)}${fillZero(min)}${fillZero(sec)}`;
}

(async function(): Promise<void> {
  // check node version
  if (!semver.gte(process.version, '10.0.0')) {
    console.log(
      chalk.red(
        `Pipcook requires node version higher than node 10.x. Howeverm your kicak node version is ${process.version}, ` +
        'Please update node.js'
      )
    );
    return;
  }

  const pkg = await readJson(join(__filename, '../../package.json'));
  program.version(pkg.version, '-v, --version');

  program
    .command('run <filename>')
    .option('--output <dir>', 'the output directory name', join(process.cwd(), dateToString(new Date())))
    .option('--nocache', 'disabel cache for framework and scripts', false)
    .option('-d --debug', 'debug mode', false)
    .description('run pipeline with a json file.')
    .action(async (filename: string, opts: RunOptions): Promise<void> => {
      let pipelineConfig;
      try {
        pipelineConfig = await readJson(filename);
        // TODO(feely): check pipeline file
      } catch (err) {
        logger.fail(`read pipeline file error: ${err.message}`);
      }
      try {
        await mkdirp(opts.output);
      } catch (err) {
        logger.fail(`create output directory error: ${err.message}`);
      }
      const runtime = new StandaloneRuntime(opts.output, pipelineConfig, !opts.nocache);
      try {
        await runtime.run();
      } catch (err) {
        if (!opts.debug) {
          logger.fail(`run pipeline error: ${err.message}`);
        } else {
          throw err;
        }
      }
    });

  program
    .command('install')
    .description("add libraries: tvm, tensorflow, pytorch...");

  program.parse(process.argv);
})();
