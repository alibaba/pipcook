#!/usr/bin/env ts-node
import semver from 'semver';
import chalk from 'chalk';
import program from 'commander';
import { init } from '../lib/init';
import { log } from '../lib/log';
import { board } from '../lib/board';
import { start } from '../lib/start';
import { devPlugin } from '../lib/devPlugin';
import { dataset } from '../lib/dataset';
import { serve } from '../lib/serve';
import childProcess from 'child_process';

const pkg = require('../package.json');

function run(): void {
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

  // version
  program.version(pkg.version, '-v, --version').usage('<command> [options]');

  // init the pipcook project workspace
  program
    .command('init')
    .option('-c, --client <string>', 'specify your npm client')
    .option('--beta', 'pull beta version')
    .option('--tuna', 'use tuna mirror to download miniconda at China')
    .description('Init the Pipcook project')
    .action(init);

  // start the pipeline. Actually same as node xxx at current stage
  program
    .command('run [fileName]')
    .description('run pipeline with config file')
    .action(start);

  // print out basic logs
  program
    .command('log')
    .description('Print out Pipcook log')
    .action(log);

  program
    .command('board')
    .description('Start Pipcook Board')
    .action(board);

  program
    .command('plugin-dev')
    .option('-t, --type <type>', 'plugin type')
    .option('-n, --name <name>', 'project name')
    .description('initialize plugin development environment')
    .action(devPlugin);

  program
    .command('dataset')
    .option('-t, --type <type>', 'action type')
    .description('type of action you want to do on dataset')
    .action(dataset);

  program
    .command('bip')
    .description('boa packages installer')
    .action(() => {
      childProcess.execSync(`./node_modules/.bin/bip ${process.argv.slice(3).join(' ')}`, {
        cwd: process.cwd()
      });
    });

  program
    .command('serve <dir>')
    .option('-p, --port <number>', 'port of server', 7682)
    .description('serve the model to predict')
    .action((dir, opts) => {
      serve(dir, opts.port);
    });

  program.parse(process.argv);
}

run();
