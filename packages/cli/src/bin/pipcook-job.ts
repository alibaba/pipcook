#!/usr/bin/env node

import program from 'commander';
import ora from 'ora';

import { runJob, getJobById, getJobs, getLogById } from '../service/job';
import { ResponseParams } from '../request';

const PipelineStatus = [ 'creating', 'running', 'success', 'fail' ];
const spinner = ora();

function fetchLog(data: ResponseParams, logs: string) {
  setTimeout(async () => {
    try {
      const jobInfo = await getJobById(data.id);
      if (!(jobInfo.status === 2 || jobInfo.status === 3)) {
        let log = await getLogById(data.id);
        log = log.log;
        let incrementLog;
        if (logs) {
          incrementLog = log.substring(log.indexOf(logs) + 1);
        } else {
          incrementLog = log;
        }    
        console.log(incrementLog);
        fetchLog(data, logs);
      }
    } catch (err) {
      spinner.fail(err.message);
    }
  }, 2000);
}

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
