import program from 'commander';
import { init } from './init';
import { log } from './log';
import { board } from './board';
import { start } from './start';
import { devPlugin } from './devPlugin';
import { dataset } from './dataset';
import { serve } from './serve';
import { execSync } from 'child_process';

const pkg = require('../../package.json');

export const initCommander = () => {
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
      execSync(`./node_modules/.bin/bip ${process.argv.slice(3).join(' ')}`, {
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
};
