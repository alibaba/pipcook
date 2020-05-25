#!/usr/bin/env node

import semver from 'semver';
import chalk from 'chalk';
import program from 'commander';
import { execSync as exec } from 'child_process';
import init from '../actions/init';
import start from '../actions/start';
import serve from '../actions/serve';
import devPlugin from '../actions/dev-plugin';

const pkg = require('../../package.json');

(function(): void {
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

  program.version(pkg.version, '-v, --version');
  program
    .command('init')
    .option('-c, --client <string>', 'specify your npm client.')
    .option('--tuna', 'use tuna mirror to download miniconda at China.')
    .description('initialize the daemon and pipboard.')
    .action(init);

  program
    .command('run <filename>')
    .option('--verbose', 'prints verbose logs')
    .description('run pipeline with a json file.')
    .action((filename, opts) => {
      start(filename, opts.verbose);
    });

  program
    .command('daemon', 'manage pipcook daemon service')
    .command('plugin', 'install one or more packages')
    .command('job', 'operate the job bound to specific pipeline')
    .command('pipeline', 'operate on pipeline');

  program
    .command('serve <id>')
    .option('-p, --port <number>', 'port of server', 7682)
    .description('serve the model to predict')
    .action((id, opts) => serve(id, opts.port));

  program
    .command('bip')
    .description('boa packages installer')
    .action(() => {
      exec(`./node_modules/.bin/bip ${process.argv.slice(3).join(' ')}`, {
        cwd: process.cwd()
      });
    });

  program
    .command('plugin-dev')
    .option('-t, --type <type>', 'plugin type')
    .option('-n, --name <name>', 'project name')
    .description('initialize plugin development environment')
    .action(devPlugin);

  program.parse(process.argv);
})();
