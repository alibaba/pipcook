#!/usr/bin/env node

import * as program from 'commander';
import { list, runAndDownloadById, remove, log, stop } from '../service/job';

program
  .command('list')
  .helpOption('--help', 'show help')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list)
  .description('list all jobs');

program
  .command('run <pipeline>')
  .helpOption('--help', 'show help')
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('--output <dir>', 'the output directory name', 'output')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(runAndDownloadById)
  .description('run a job from a pipeline id');

program
  .command('remove <id>')
  .helpOption('--help', 'show help')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(remove)
  .description('remove all the jobs');

program
  .command('log <job>')
  .helpOption('--help', 'show help')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(log)
  .description('show logs by the given job id');

program
  .command('stop <job>').alias('cancel')
  .helpOption('--help', 'show help')
  .option('-h|--host-ip <ip>', 'the host ip of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(stop)
  .description('stop job by the given job id');

program.parse(process.argv);
