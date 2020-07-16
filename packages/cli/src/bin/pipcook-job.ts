#!/usr/bin/env node

import program from 'commander';
import { get } from '../request';
import { run } from '../pipeline';
import { route } from '../router';
import { logStart, logSuccess, logFail } from '../utils';

const PipelineStatus = [ 'creating', 'running', 'success', 'fail' ];

async function list(): Promise<void> {
  const jobs = await get(`${route.job}/list`);
  console.table(jobs.rows.map((item: any) => {
    item.status = PipelineStatus[item.status];
    return item;
  }), [ 'id', 'status', 'evaluatePass', 'createdAt' ]);
}

async function remove(): Promise<void> {
  logStart('removing jobs...');
  await get(`${route.job}/remove`);
  logSuccess('remove jobs succeeded');
}

async function stop(id: string): Promise<void> {
  logStart('stopping jobs...');
  const err = await get(`${route.job}/stop`, { id });
  err ? logFail(err.message) : logSuccess('stop job succeeded');
}

async function log(id: string): Promise<void> {
  const log = await get(`${route.job}/${id}/log`);
  console.log(log);
}

program
  .command('list')
  .action(list)
  .description('list all jobs');

program
  .command('run <pipeline>')
  .option('--verbose', 'prints verbose logs', true)
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('--output', 'the output directory name', 'output')
  .action(run)
  .description('run a job from a pipeline id');

program
  .command('remove')
  .action(remove)
  .description('remove all the jobs');

program
  .command('log <job>')
  .action(log)
  .description('show logs by the given job id');

program
  .command('stop <job>')
  .action(stop)
  .description('stop job by the given job id');

program.parse(process.argv);
