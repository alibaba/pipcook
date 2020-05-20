import program from 'commander';
import { init } from './init';
import { devPlugin } from './devPlugin';
import { serve } from './serve';
import { execSync } from 'child_process';
import { pipeline as pipelineHandler } from './pipeline';
import { job } from './job';
import { daemon } from './daemon';
import { start } from './start';

const pkg = require('../../package.json');

export const initCommander = () => {
  // version
  program.version(pkg.version, '-v, --version').usage('<command> [options]');

  // init the pipcook project workspace
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
      start(filename, opts.verbose === 'true');
    });

  program
    .command('daemon <op>')
    .description('start/stop service')
    .action(daemon);

  program
    .command('job <operation> [id]')
    .option('-p, --pipeline <pipeline>', 'get job with specified pipeline')
    .option('--verbose', 'print verbose logs')
    .description('operate the job bound to specific pipeline')
    .action((operation, id, opts) => {
      job(operation, id, opts.pipeline, opts.verbose);
    });

  program
    .command('pipeline <operation> [pipeline] [pipelineId]')
    .description('operate on pipeline')
    .action(pipelineHandler);

  program
    .command('plugin-dev')
    .option('-t, --type <type>', 'plugin type')
    .option('-n, --name <name>', 'project name')
    .description('initialize plugin development environment')
    .action(devPlugin);

  program
    .command('bip')
    .description('boa packages installer')
    .action(() => {
      execSync(`./node_modules/.bin/bip ${process.argv.slice(3).join(' ')}`, {
        cwd: process.cwd()
      });
    });

  program
    .command('serve <id>')
    .option('-p, --port <number>', 'port of server', 7682)
    .description('serve the model to predict')
    .action((jobId, opts) => {
      serve(jobId, opts.port);
    });

  program.parse(process.argv);
};
