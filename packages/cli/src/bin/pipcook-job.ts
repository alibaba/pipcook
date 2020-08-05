#!/usr/bin/env node

import program from 'commander';
import { list, runAndDownload, remove, log, stop } from '../actions/job';

program
  .command('list')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list)
  .description('list all jobs');

program
  .command('run <pipeline>')
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('--output', 'the output directory name', 'output')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(runAndDownload)
  .description('run a job from a pipeline id');

program
  .command('remove <id>')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(remove)
  .description('remove all the jobs');

program
  .command('log <job>')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(log)
  .description('show logs by the given job id');

program
  .command('stop <job>').alias('cancel')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(stop)
  .description('stop job by the given job id');

program.parse(process.argv);
