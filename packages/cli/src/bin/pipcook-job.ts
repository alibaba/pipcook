#!/usr/bin/env node

import { ChildProcess } from 'child_process';
import program from 'commander';
import { get, listen } from '../request';
import { route } from '../router';
import { tail } from '../utils';
import { tunaMirrorURI } from '../config';
import { ora } from '../utils';

const PipelineStatus = [ 'creating', 'running', 'success', 'fail' ];

async function list(): Promise<void> {
  const jobs = await get(`${route.job}/list`);
  console.table(jobs.rows.map((item: any) => {
    item.status = PipelineStatus[item.status];
    return item;
  }), [ 'id', 'status', 'evaluatePass', 'createdAt' ]);
}

async function run(id: string, opts: any): Promise<void> {
  const spinner = ora();
  const params = {
    cwd: process.cwd(),
    pipelineId: id,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  if (!opts.verbose) {
    const job = await get(`${route.job}/run`, params);
    spinner.succeed(`create job(${job.id}) succeeded.`);
  } else {
    let stdout: ChildProcess, stderr: ChildProcess;
    spinner.start(`start running ${id}...`);
    await listen(`${route.job}/run`, params, {
      'job created': (e: MessageEvent) => {
        const job = JSON.parse(e.data);
        spinner.succeed(`create job(${job.id}) succeeded.`);
        stdout = tail(job.id, 'stdout');
        stderr = tail(job.id, 'stderr');
      },
      'job finished': (e: MessageEvent) => {
        const job = JSON.parse(e.data);
        spinner.succeed(`job(${job.id}) is finished with ${e.data}`);
        stdout?.kill();
        stderr?.kill();
      },
      'error': (e: MessageEvent) => {
        spinner.fail(`occurrs an error ${e.data}`);
        stdout?.kill();
        stderr?.kill();
        process.exit(1);
      }
    });
  }
}

async function remove(): Promise<void> {
  const spinner = ora();
  spinner.start('removing jobs...');
  await get(`${route.job}/remove`);
  spinner.succeed('remove jobs succeeded');
}

async function stop(id: string): Promise<void> {
  const spinner = ora();
  spinner.start('stopping jobs...');
  const err = await get(`${route.job}/stop`, { id });
  err ? spinner.fail(err.message) : spinner.succeed('stop job succeeded');
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
  .option('--verbose', 'prints verbose logs')
  .option('--tuna', 'use tuna mirror to install python packages')
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
