#!/usr/bin/env node

import * as semver from 'semver';
import * as chalk from 'chalk';
import * as program from 'commander';
import { join, basename, extname, resolve, dirname } from 'path';
import { parse } from 'url';
import * as constants from '../constants';
import { readJson, mkdirp, remove, copy, readFile, stat } from 'fs-extra';
import { StandaloneRuntime } from '../runtime';
import {
  logger,
  dateToString,
  downloadWithProgress,
  unZipData,
  fitModelDir,
  makeWorkspace,
  DownloadProtocol,
  PostPredict,
  PredictDataset,
  downloadAndExtractTo
} from '../utils';
import { PredictInput } from '../utils/predict-dataset';
import { ServePredict } from '../utils';
import { PipelineMeta } from '@pipcook/costa';

export interface BaseOptions {
  // Fetch the framework and script without cache
  nocache: boolean;
  // Debug model
  debug: boolean;
  // Framework mirror
  mirror: string;
  // Development mode
  dev: boolean;
}
export interface TrainOptions extends BaseOptions {
  // Workspace for running
  output: string;
  // NPM client name
  npmClient: string;
  // NPM registry
  registry?: string;
}

export interface PredictOptions extends BaseOptions {
  // input for predict
  str?: string;
  uri?: string;
}

export interface ServeOptions extends BaseOptions {
  // listen port
  port: number;
}

export interface CacheCleanOptions {
  // clean framework cache only
  framework: boolean;
  // clean script cache only
  script: boolean;
}

/**
 * Prepare runtime for predict.
 * @param uri could be workspace directory in local or artifact zip file
 * @param opts predict options
 * @returns runtime and pipeline metadata
 */
export const preparePredict = async (
  uri: string,
  opts: BaseOptions
): Promise<{
  runtime: StandaloneRuntime,
  pipelineMeta: PipelineMeta,
  workspace: string,
  isNewWorkspace: boolean
}> => {
  let workspace: string;
  let pipelineFilePath: string;
  let isNewWorkspace = false;
  const urlObj = parse(uri);
  let st, modelDir;
  switch (urlObj.protocol) {
  case null:
  case DownloadProtocol.FILE:
    urlObj.path = resolve(urlObj.path);
    st = await stat(urlObj.path);
    if (st.isDirectory()) {
      workspace = urlObj.path;
      pipelineFilePath = join(workspace, constants.WorkspaceModelDir, constants.PipelineFileInModelDir);
    } else if (extname(urlObj.path) === '.json') {
      workspace = dirname(urlObj.path);
      pipelineFilePath = urlObj.path;
    } else if (extname(urlObj.path) === '.zip') {
      workspace = await makeWorkspace();
      modelDir = join(workspace, constants.WorkspaceModelDir);
      await unZipData(urlObj.path, modelDir);
      await fitModelDir(modelDir);
      pipelineFilePath = join(modelDir, constants.PipelineFileInModelDir);
      isNewWorkspace = true;
    } else {
      throw new TypeError(`'${uri}' is not a valid workspace or artifact.`);
    }
    break;
  case DownloadProtocol.HTTP:
  case DownloadProtocol.HTTPS:
    workspace = await makeWorkspace();
    modelDir = join(workspace, constants.WorkspaceModelDir);
    await downloadAndExtractTo(uri, modelDir);
    await fitModelDir(modelDir);
    pipelineFilePath = join(modelDir, constants.PipelineFileInModelDir);
    isNewWorkspace = true;
    break;
  default:
    throw new TypeError(`protocol '${urlObj.protocol}' not supported when predict`);
  }
  const pipelineMeta = await readJson(pipelineFilePath);
  // TODO(feely): check pipeline file
  const runtime = new StandaloneRuntime({
    workspace,
    pipelineMeta,
    mirror: opts.mirror,
    enableCache: !opts.nocache,
    npmClient: 'npm',
    devMode: opts.dev
  });
  await runtime.prepare(false);
  return { runtime, pipelineMeta, workspace, isNewWorkspace };
};

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

export const predict = async (pipelineFile: string, opts: PredictOptions): Promise<void> => {
  try {
    const inputs: Array<PredictInput> = [];
    if (opts.str) {
      inputs.push(opts.str);
    } else if (opts.uri) {
      inputs.push((await readFile(opts.uri)));
    } else {
      throw new TypeError('Str or uri should be specified, see `pipcook predict --help` for more information.');
    }
    const { runtime, pipelineMeta, workspace, isNewWorkspace } = await preparePredict(pipelineFile, opts);
    logger.info('prepare data source');
    const datasource = await PredictDataset.makePredictDataset(inputs, pipelineMeta.type);
    if (!datasource) {
      throw new TypeError(`invalid pipeline type: ${pipelineMeta.type}`);
    }
    const predictResult = await runtime.predict(datasource);
    await PostPredict.processData(predictResult, {
      type: pipelineMeta.type,
      inputs: [ opts.str || opts.uri ]
    });
    if (isNewWorkspace) {
      logger.warn(`The workspace has been created, and you should type 'pipcook predict ${workspace} -s/-t <data>' to predict next time.`);
    }
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

export const serve = async (pipelineFile: string, opts: ServeOptions ): Promise<void> => {
  try {
    const { runtime, pipelineMeta, workspace, isNewWorkspace } = await preparePredict(pipelineFile, opts);
    await ServePredict.serve(
      Number(opts.port),
      pipelineMeta.type,
      async (buf: Buffer[]): Promise<Record<string, any>[]> => {
        logger.info('prepare data source');
        const datasource = await PredictDataset.makePredictDataset(buf, pipelineMeta.type);
        if (!datasource) {
          throw new TypeError(`invalid pipeline type: ${pipelineMeta.type}`);
        }
        return await runtime.predict(datasource);
      }
    );
    logger.success(`Pipcook workspace '${workspace}' served at: http://localhost:${opts.port}`);
    if (isNewWorkspace) {
      logger.warn(`The workspace has been created, and you should type 'pipcook serve ${workspace}' to serve it next time.`);
    }
  } catch (err) {
    logger.fail(`serve error: ${ opts.debug ? err.stack : err.message }`);
  }
};

(async function(): Promise<void> {
  // check node version
  if (!semver.gte(process.version, '12.17.0') || semver.major(process.version) === 13) {
    console.log(
      chalk.red(
        `Pipcook requires node version higher than node 12.17.0 or 14.0.0. Howeverm your kicak node version is ${process.version}, ` +
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
    .option('-o --output <dir>', 'the output directory name', join(process.cwd(), dateToString(new Date())))
    .option('-m --mirror <mirror>', 'framework mirror', '')
    .option('-c --npmClient <npm>', 'npm client binary for artifact installing', 'npm')
    .option('--registry <registry>', 'npm registry for artifact installing')
    .option('-d --debug', 'debug mode', false)
    .option('--dev', 'development mode', false)
    .option('--nocache', 'disabel cache for framework and scripts', false)
    .description('run pipeline with a json file.\nsee for detail:\nEnglish: https://alibaba.github.io/pipcook/#/\n中文: https://alibaba.github.io/pipcook/#/zh-cn')
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
    .description('predict with string or uri.\nsee for detail:\nEnglish: https://alibaba.github.io/pipcook/#/\n中文: https://alibaba.github.io/pipcook/#/zh-cn')
    .action(predict);

  program
    .command('clean')
    .action(cacheClean)
    .description('clean pipcook cache, include framework and script');

  program
    .command('serve <pipelineFile>')
    .option('-p --port <port>', 'listen port', 9091)
    .option('-s --str <str>', 'predict as string')
    .option('-u --uri <uri>', 'predict file uri')
    .option('-m --mirror <mirror>', 'framework mirror', constants.PIPCOOK_FRAMEWORK_MIRROR_BASE)
    .option('-d --debug', 'debug mode', false)
    .option('--dev', 'development mode', false)
    .option('--nocache', 'disabel cache for framework and scripts', false)
    .action(serve)
    .description('serve model on specified port');

  program.parse(process.argv);
})();
