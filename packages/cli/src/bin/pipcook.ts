#!/usr/bin/env node

import * as semver from 'semver';
import * as chalk from 'chalk';
import * as program from 'commander';
import { join, basename, extname,resolve } from 'path';
import { parse } from 'url';
import * as constants from '../constants';
import { readJson, mkdirp, remove, copy } from 'fs-extra';
import { StandaloneRuntime } from '../runtime';
import { logger, dateToString, downloadWithProgress, DownloadProtocol } from '../utils';

export interface RunOptions {
  // Workspace for running
  output: string;
  // Fetch the framework and script without cache
  nocache: boolean;
  // Debug model
  debug: boolean;
  mirror: string;
}

export interface CacheCleanOptions {
  // clean framework cache only
  framework: boolean;
  // clean script cache only
  script: boolean;
}

export const run = async (filename: string, opts: RunOptions): Promise<void> => {
  let pipelineConfig;
  opts.output=resolve(opts.output)
  try {
    await mkdirp(opts.output);
    const urlObj = parse(filename);
    const name = basename(urlObj.path);
    const pipelinePath = join(opts.output, name);
    if (extname(name) !== '.json') {
      console.warn('pipeline configuration file should be a json file');
    }
    switch (urlObj.protocol) {
    case null:
    case DownloadProtocol.FILE:
      await copy(urlObj.path, pipelinePath);
      break;
    case DownloadProtocol.HTTPS:
    case DownloadProtocol.HTTP:
      await downloadWithProgress(filename, pipelinePath);
      break;
    default:
      throw new TypeError(`protocol '${urlObj.protocol}' not supported`);
    }
    pipelineConfig = await readJson(pipelinePath);
    // TODO(feely): check pipeline file
    const runtime = new StandaloneRuntime(opts.output, pipelineConfig, opts.mirror, !opts.nocache);
    await runtime.run();
  } catch (err) {
    logger.fail(`run pipeline error: ${ opts.debug ? err.stack : err.message }`);
  }
};

export const cacheClean = async (): Promise<void> => {
  await Promise.all([
    remove(constants.PIPCOOK_FRAMEWORK_PATH),
    remove(constants.PIPCOOK_SCRIPT_PATH)
  ]);
  logger.success('done');
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

  const pkg = await readJson(join(__filename, '../../../package.json'));
  program.version(pkg.version, '-v, --version');

  program
    .command('run <filename>')
    .option('--output <dir>', 'the output directory name', join(process.cwd(), dateToString(new Date())))
    .option('--nocache', 'disabel cache for framework and scripts', false)
    .option('-d --debug', 'debug mode', false)
    .option('-m --mirror <mirror>', 'framework mirror', '')
    .description('run pipeline with a json file.')
    .action(run);

  program
    .command('clean')
    .action(cacheClean)
    .description('clean pipcook cache, include framework and script');

  program.parse(process.argv);
})();
