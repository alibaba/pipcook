#!/usr/bin/env node
const semver = require('semver');
const chalk = require('chalk');
const program = require('commander');
const childProcess = require('child_process');
const pkg = require('../package.json');
const init = require('../lib/init');
const log = require('../lib/log');
const board = require('../lib/board');
const start = require('../lib/start');
const devPlugin = require('../lib/devPlugin');
const dataset = require('../lib/dataset');
const serve = require('../lib/serve');

// check node version
if (!semver.gte(process.version, '10.0.0')) {
  console.log(
    chalk.red(
      `Pipcook requires node version higher than node 10.x. Howeverm your kicak node version is ${process.version}, `
      + 'Please update node.js'
    )
  );
  return;
}

// version
program.version(pkg.version, '-v, --version').usage('<command> [options]');

// init the pipcook project workspace
program
  .command('init')
  .option('-c, --client', 'npm client')
  .option('--beta', 'pull beta version')
  .description('Init the Pipcook project')
  .action((dir, cmdObj) => {
    init(cmdObj);
  });

// start the pipeline. Actually same as node xxx at current stage
program
  .command('run [fileName]')
  .description('run pipeline with config file')
  .action((fileName) => {
    start(fileName);
  });

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
  .option('-t, --type', 'plugin type')
  .option('-n, --name', 'project name')
  .description('initialize plugin development environment')
  .action((dir, cmdObj) => {
    devPlugin(cmdObj);
  });

program
  .command('dataset')
  .option('-t, --type', 'action type')
  .description('type of action you want to do on dataset')
  .action((dir, cmdObj) => {
    dataset(cmdObj);
  });

program
  .command('bip')
  .description('boa packages installer')
  .action(() => {
    childProcess.execSync(`./node_modules/.bin/bip ${process.argv.slice(3).join(' ')}`, {
      cwd: process.cwd()
    });
  });

program
  .command('serve [deployPath]')
  .option('-p, --port', 'port of server')
  .description('serve the model to predict')
  .action((port, cmd, deployPath) => {
    if (!deployPath) {
      serve(port);
    } else {
      serve(deployPath[0], port);
    }
  });

program.parse(process.argv);
