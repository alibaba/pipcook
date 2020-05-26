#!/usr/bin/env node

import program from 'commander';
import ora from 'ora';
import { get } from '../request';
import { route } from '../router';

const PipelineStatus = [ 'creating', 'running', 'success', 'fail' ];

async function list(): Promise<void> {
  const jobs = await get(`${route.job}/list`);
  console.table(jobs.map((item: any) => {
    item.status = PipelineStatus[item.status];
    return item;
  }), [ 'id', 'status', 'evaluatePass', 'createdAt' ]);
}

async function run(id: string, opts: any): Promise<void> {
  const spinner = ora();
  const data = await get(`${route.job}/${id}/run`);
  spinner.succeed(`create job ${data.id} succeeded`);
}

async function remove() {
  const spinner = ora();
  spinner.start('removing jobs...');
  await get(`${route.job}/remove`);
  spinner.succeed('remove jobs succeeded');
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
  .command('start <pipeline>')
  .action(run)
  .description('start a job from a pipeline id');

program
  .command('remove')
  .action(remove)
  .description('remove all the jobs');

program
  .command('log <job>')
  .action(log)
  .description('show logs by the given job id');

program.parse(process.argv);
