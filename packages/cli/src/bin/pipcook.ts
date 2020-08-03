#!/usr/bin/env node

import semver from 'semver';
import chalk from 'chalk';
import program from 'commander';
import { execSync as exec } from 'child_process';
import { join } from 'path';
import { constants } from '@pipcook/pipcook-core';
import { pathExists } from 'fs-extra';

import { start } from './pipcook-job';
import init from '../actions/init';
import serve from '../actions/serve';
import board from '../actions/board';
import devPlugin from '../actions/dev-plugin';

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

  const pkg = require('../../package.json');

  const versionStr = [
    `Pipcook Tools   v${pkg.version} ${join(__dirname, '../../')}`
  ];
  const daemonPath = join(constants.PIPCOOK_DAEMON_SRC, 'package.json');
  const boardPath = join(constants.PIPCOOK_BOARD_SRC, 'package.json');
  if (await pathExists(daemonPath)) {
    const daemonPkg = require(daemonPath);
    versionStr.push(`Pipcook Daemon  v${daemonPkg.version} ${constants.PIPCOOK_DAEMON_SRC}`);
  }
  if (await pathExists(boardPath)) {
    const boardPkg = require(join(constants.PIPCOOK_BOARD_SRC, 'package.json'));
    versionStr.push(`Pipboard        v${boardPkg.version} ${constants.PIPCOOK_BOARD_SRC}`);
  }

  program.version(versionStr.join('\n'), '-v, --version');
  program
    .command('init')
    .option('-c, --client <string>', 'specify your npm client.')
    .option('-b, --beta', 'use or update the beta version')
    .option('--tuna', 'use tuna mirror to download miniconda at China.')
    .description('initialize the daemon and pipboard.')
    .action(init);

  program
    .command('board')
    .description('open the pipboard')
    .action(board);

  program
    .command('run <filename>')
    .option('--tuna', 'use tuna mirror to install python packages')
    .option('--output', 'the output directory name', 'output')
    .option('-h|--host <host>', 'the host of daemon')
    .option('-p|--port <port>', 'the port of daemon')
    .description('run pipeline with a json file.')
    .action(start);

  program
    .command('serve <dir>')
    .option('-p, --port <number>', 'port of server', 7682)
    .description('serve the model to predict')
    .action(serve);

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

  program
    .command('daemon', 'manage pipcook daemon service')
    .command('plugin', 'install one or more packages')
    .command('app', 'experimental PipApp Script')
    .command('job', 'operate the job bound to specific pipeline')
    .command('pipeline', 'operate on pipeline');

  program.parse(process.argv);
})();
