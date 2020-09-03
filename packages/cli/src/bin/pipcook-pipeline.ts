#!/usr/bin/env node

import program from 'commander';
import { prompt } from 'inquirer';
import { list, info, create, update, remove, install, listJobsByPipelineId } from '../service/pipeline';


program
  .command('list')
  .helpOption('--help', 'show help')
  .description('list all pipelines')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list);

program
  .command('info <id>')
  .helpOption('--help', 'show help')
  .description('info the pipeline by its id')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(info);

program
  .command('create <file>')
  .helpOption('--help', 'show help')
  .description('create a pipeline')
  .option('-n|--name <name>', 'the pipeline name')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(create);

program
  .command('update <id> <filename>')
  .helpOption('--help', 'show help')
  .description('update a pipeline')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(update);

program
  .command('remove [id]')
  .helpOption('--help', 'show help')
  .description('remove all pipelines or specific 1 pipeline via id')
  .option('-y|--yes', 'remove jobs without confirmation')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(async (id: string, opts: any) => {
    if (id === 'all') {
      id = undefined;
    }
    const jobs = await listJobsByPipelineId(id, opts);
    let confirm = !!opts.yes;
    if (!opts.yes) {
      if (jobs.length > 0) {
        const answer = await prompt([
          {
            type: 'confirm',
            name: 'remove',
            message: `${jobs.length} ${jobs.length > 1 ? 'jobs' : 'job'} which belong to the pipeline will be removed too, continue?`,
            default: false
          }
        ]);
        confirm = answer.remove;
      } else {
        confirm = true;
      }
    }
    if (confirm) {
      return remove(id, jobs, opts);
    }
  });

program
  .command('install <pipeline>')
  .helpOption('--help', 'show help')
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(install)
  .description('install the plugins from a pipeline config file or url');

program.parse(process.argv);
