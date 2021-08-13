#!/usr/bin/env node

import * as semver from 'semver';
import * as chalk from 'chalk';
import * as program from 'commander';
import { join, basename, extname, resolve, dirname } from 'path';
import { parse } from 'url';
import * as constants from '../constants';
import { readJson, mkdirp, remove, copy, readFile } from 'fs-extra';
import { StandaloneRuntime } from '../runtime';
import { logger, dateToString, downloadWithProgress, DownloadProtocol, PostPredict } from '../utils';
import { PredictInput } from '../utils/predict-dataset';
import "@pipcook/core";
export interface TrainOptions {
  // Workspace for running
  output: string;
  // Fetch the framework and script without cache
  nocache: boolean;
  // Debug model
  debug: boolean;
  mirror: string;
  // NPM client name
  npmClient: string;
  // NPM registry
  registry?: string;
  // Development mode
  dev: boolean;
}

export interface PredictOptions {
  // input for predict
  str?: string;
  uri?: string;
  // Fetch the framework and script without cache
  nocache: boolean;
  // Debug model
  debug: boolean;
  mirror: string;
  // Development mode
  dev: boolean;
}

export interface CacheCleanOptions {
  // clean framework cache only
  framework: boolean;
  // clean script cache only
  script: boolean;
}

/**
 * Train model though pipeline.
 * @param uri pipeline file uri
 * @param opts train options
 */
export const train = async (uri: string, opts: TrainOptions): Promise<void> => {
  let pipelineConfig;
  opts.output = resolve(opts.output);
  try {
    await mkdirp(opts.output);
    const urlObj = parse(uri);
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
      await downloadWithProgress(uri, pipelinePath);
      break;
    default:
      throw new TypeError(`protocol '${urlObj.protocol}' not supported`);
    }
    pipelineConfig = await readJson(pipelinePath);
    // TODO(feely): check pipeline file
    const runtime = new StandaloneRuntime({
      workspace: opts.output,
      pipelineMeta: pipelineConfig,
      mirror: opts.mirror,
      enableCache: !opts.nocache,
      npmClient: opts.npmClient,
      registry: opts.registry,
      devMode: opts.dev
    });
    await runtime.prepare();
    await runtime.train();
  } catch (err) {
    logger.fail(`run pipeline error: ${ opts.debug ? err.stack : err.message }`);
  }
};

export const predict = async (filename: string, opts: PredictOptions): Promise<void> => {
  let pipelineConfig;
  try {
    const urlObj = parse(filename);
    switch (urlObj.protocol) {
    case null:
    case DownloadProtocol.FILE:
      urlObj.path = resolve(urlObj.path);
      break;
    default:
      throw new TypeError(`protocol '${urlObj.protocol}' not supported when predict`);
    }
    const name = basename(urlObj.path);
    if (extname(name) !== '.json') {
      console.warn('pipeline configuration file should be a json file');
    }
    const workspace = dirname(urlObj.path);
    pipelineConfig = await readJson(urlObj.path);
    // TODO(feely): check pipeline file
    const runtime = new StandaloneRuntime({
      workspace,
      pipelineMeta: pipelineConfig,
      mirror: opts.mirror,
      enableCache: !opts.nocache,
      npmClient: 'npm',
      devMode: opts.dev
    });
    await runtime.prepare();
    const inputs: Array<PredictInput> = [];
    if (opts.str) {
      inputs.push(opts.str);
    } else if (opts.uri) {
      inputs.push((await readFile(opts.uri)));
    } else {
      throw new TypeError('Str or uri should be specified, see `pipcook predict --help` for more information.');
    }
    const predictResult = await runtime.predict(inputs);
    await PostPredict.processData(predictResult, {
      type: pipelineConfig.type,
      inputs: [ opts.str || opts.uri ]
    });
  } catch (err) {
    logger.fail(`predict error: ${ opts.debug ? err.stack : err.message }`);
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
    .command('run <uri>')
    .alias('train')
    .alias('t')
    .option('--output <dir>', 'the output directory name', join(process.cwd(), dateToString(new Date())))
    .option('-m --mirror <mirror>', 'framework mirror', '')
    .option('-c --npmClient <npm>', 'npm client binary for artifact installing', 'npm')
    .option('--registry <registry>', 'npm registry for artifact installing')
    .option('-d --debug', 'debug mode', false)
    .option('--dev', 'development mode', false)
    .option('--nocache', 'disabel cache for framework and scripts', false)
    .description('run pipeline with a json file.')
    .action(train);

  program
    .command('predict <pipelineFile>')
    .alias('p')
    .option('-s --str <str>', 'predict as string')
    .option('-u --uri <uri>', 'predict file uri')
    .option('-m --mirror <mirror>', 'framework mirror', '')
    .option('-d --debug', 'debug mode', false)
    .option('--dev', 'development mode', false)
    .option('--nocache', 'disabel cache for framework and scripts', false)
    .description('predict with string or uri.')
    .action(predict);

  program
    .command('clean')
    .action(cacheClean)
    .description('clean pipcook cache, include framework and script');

  program.parse(process.argv);
})();
