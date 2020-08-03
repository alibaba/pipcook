#!/usr/bin/env node

import program from 'commander';
import start from '../actions/start';
import { logger, initClient } from '../utils';

const PipelineStatus = [ 'creating', 'running', 'success', 'fail' ];

async function list(opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  const jobs = client.job.list();
  if ((await jobs).length > 0) {
    console.table((await jobs).map( job => {
      return { ...job, status: PipelineStatus[job.status] }
    }), [ 'id', 'status', 'evaluatePass', 'createdAt' ]);
  } else {
    console.info('no job is created.');
  }
}

async function remove(id: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  logger.start('removing jobs...');
  try {
    await client.job.remove(id);
    logger.success('remove jobs succeeded');
  } catch (err) {
    logger.fail(err.message);
  }
}

async function stop(id: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  logger.start('stopping jobs...');
  try {
    await client.job.cancel(id);
    logger.success('stop job succeeded');
  }
  catch (err) {
    logger.fail(err.message);
  }
}

async function log(id: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  try {
    const log = await client.job.log(id);
    console.log(log);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

program
  .command('list')
  .option('-h|--host <host>', 'the host of daemon', '127.0.0.1')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list)
  .description('list all jobs');

program
  .command('run <pipeline>')
  .option('--verbose', 'prints verbose logs', true)
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('--output', 'the output directory name', 'output')
  .option('-h|--host <host>', 'the host of daemon', '127.0.0.1')
  .option('-p|--port <port>', 'the port of daemon')
  .action(start)
  .description('run a job from a pipeline id');

program
  .command('remove <id>')
  .option('-h|--host <host>', 'the host of daemon', '127.0.0.1')
  .option('-p|--port <port>', 'the port of daemon')
  .action(remove)
  .description('remove all the jobs');

program
  .command('log <job>')
  .option('-h|--host <host>', 'the host of daemon', '127.0.0.1')
  .option('-p|--port <port>', 'the port of daemon')
  .action(log)
  .description('show logs by the given job id');

program
  .command('stop <job>')
  .option('-h|--host <host>', 'the host of daemon', '127.0.0.1')
  .option('-p|--port <port>', 'the port of daemon')
  .action(stop)
  .description('stop job by the given job id');

program.parse(process.argv);
