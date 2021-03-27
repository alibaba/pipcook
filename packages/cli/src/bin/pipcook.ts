#!/usr/bin/env node

import * as semver from 'semver';
import * as chalk from 'chalk';
import * as program from 'commander';
import * as fs from 'fs-extra';
import { join } from 'path';
import { constants } from '@pipcook/core';
import { readJson, mkdirp, remove } from 'fs-extra';
import { StandaloneRuntime } from '../runtime';
import { logger, dateToString, execAsync, downloadFromGit } from '../utils';

const templateMap: Record<string, string> = {
  'datasource': 'imgcook/pipcook-datasource-template',
  'dataflow': 'imgcook/pipcook-dataflow-template',
  'model': 'imgcook/pipcook-model-template'
};

const scriptTypeDescription = 'scriptType should be one of \'datasource<@branch>\', \'dataflow<@branch>\', \'model<@branch>\'.\n\
The templates locate at:\n\
  datasource: https://github.com/imgcook/pipcook-datasource-template\n\
  dataflow: https://github.com/imgcook/pipcook-dataflow-template\n\
  model: https://github.com/imgcook/pipcook-model-template';

export interface RunOptions {
  output: string;
  nocache: boolean;
  debug: boolean;
  mirror: string;
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
    const runtime = new StandaloneRuntime(opts.output, pipelineConfig, opts.mirror, !opts.nocache);
    await runtime.run();
  } catch (err) {
    logger.fail(`run pipeline error: ${ opts.debug ? err.stack : err.message }`);
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

export const createScriptRepo = async (scriptType: string, name: string): Promise<void> => {
  try {
    const destDir = join(process.cwd(), name);
    const pkgFile = join(destDir, 'package.json');
    if (await fs.pathExists(destDir)) {
      throw new TypeError(`The directory ${name} already exists`);
    }
    const [ type, branch = 'main' ] = scriptType.split('@');
    if (!templateMap[type]) {
      throw new TypeError(`no template found for ${scriptType}, it should be one of 'datasource', 'dataflow', 'model'`);
    }
    const template = `${templateMap[type]}#${branch}`;
    logger.start('downloading template');
    await downloadFromGit(template, destDir, { clone: true });
    if (await fs.pathExists(pkgFile)) {
      const pkg = await fs.readJson(pkgFile);
      pkg.name = name;
      await fs.writeJson(pkgFile, pkg, { spaces: 2 });
      logger.start('initializing project');
      await execAsync('npm i', { cwd: destDir });
    }
    logger.info('initialize script project successfully');
  } catch (err) {
    logger.fail(`create from template failed: ${err.message}`);
  }
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
    .option('-m --mirror <mirror>', 'framework mirror', '')
    .description('run pipeline with a json file.')
    .action(run);

  program
    .command('clean')
    .option('-f --framework', 'clean cache for framework', true)
    .option('-s --script', 'clean cache for scripts', true)
    .action(cacheClean)
    .description('clean pipcook cache, include framework and script');

  program
    .command('install')
    .description('install dependencies non-essential: tvm, emscripten, and ...');

  program
    .command('script <scriptType> <name>')
    .description('create script repo from template at current working directory', {
      scriptType: scriptTypeDescription,
      name: 'your project name, it\'s also the directory name'
    })
    .action(createScriptRepo);

  program.parse(process.argv);
})();
