#!/usr/bin/env node

import * as semver from 'semver';
import * as chalk from 'chalk';
import * as program from 'commander';
import { join } from 'path';
import { constants } from '@pipcook/pipcook-core';
import { readJson, mkdirp, remove } from 'fs-extra';
import { StandaloneRuntime } from '../runtime';
import { logger, dateToString } from '../utils';

export interface RunOptions {
  output: string;
  nocache: boolean;
  debug: boolean;
}

export interface CacheCleanOptions {
  framework: boolean;
  script: boolean;
}

export const run = async (filename: string, opts: RunOptions): Promise<void> => {
  let pipelineConfig;
  try {
    pipelineConfig = await readJson(filename);
    // TODO(feely): check pipeline file
    await mkdirp(opts.output);
    const runtime = new StandaloneRuntime(opts.output, pipelineConfig, !opts.nocache);
    await runtime.run();
  } catch (err) {
    if (!opts.debug) {
      logger.fail(`run pipeline error: ${err.message}`);
    } else {
      throw err;
    }
  }
};

export const cacheClean = async (opts: CacheCleanOptions): Promise<void> => {
  const futures = [];
  if (opts.framework) {
    futures.push(remove(constants.PIPCOOK_FRAMEWORK_PATH));
  }
  if (opts.script) {
    futures.push(remove(constants.PIPCOOK_SCRIPT_PATH));
  }
  await Promise.all(futures);
};

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
    .action(run);

  program
    .command('clean')
    .option('-fm --framework', 'clean cache for framework', true)
    .option('-s --script', 'clean cache for scripts', true)
    .action(cacheClean)
    .description("clean pipcook cache, include framework, script");

  program
    .command('install')
    .description("add libraries: tvm, tensorflow, pytorch...");

  program.parse(process.argv);
})();
