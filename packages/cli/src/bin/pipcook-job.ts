#!/usr/bin/env node

import program from 'commander';
import ora from 'ora';

import { runJob, getJobs, getLogById } from '../service/job';
import { fetchLog } from '../utils';

const PipelineStatus = [ 'creating', 'running', 'success', 'fail' ];
const spinner = ora();

async function list(): Promise<void> {
  const jobs = await getJobs();
  const outputs = jobs.rows.map((row: Record<'id' | 'pipelineId' | 'status' | 'createdAt', any>) => ({
    id: row.id,
    pipelineId: row.pipelineId,
    status: PipelineStatus[row.status],
    createdAt: row.createdAt
  }));
  console.table(outputs);
}

async function run(id: string, opts: any): Promise<void> {
  const data = await runJob(id);
  spinner.succeed(`create job ${data.id} succeeded`);
  if (opts.verbose === true) {
    fetchLog(data, '');
  }
}

async function log(id: string): Promise<void> {
  const data = await getLogById(id);
  console.log(data);
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
  .command('log <job>')
  .action(log)
  .description('show logs by the given job id');

program.parse(process.argv);
