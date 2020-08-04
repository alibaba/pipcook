#!/usr/bin/env node

import program from 'commander';
import { join, isAbsolute } from 'path';
import * as fs from 'fs-extra';
import { PipelineStatus } from '@pipcook/pipcook-core';
import { JobStatus } from '@pipcook/sdk';
import { JobResp } from '@pipcook/sdk';
import { tunaMirrorURI } from '../config';
import { logger, initClient, traceLogger, extractToPath } from '../utils';

async function list(opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  const jobs = await client.job.list();
  if (jobs.length > 0) {
    console.table(jobs.map( (job) => {
      return { ...job, status: JobStatus[job.status] };
    }), [ 'id', 'status', 'evaluatePass', 'createdAt' ]);
  } else {
    console.info('no job is created.');
  }
}

async function remove(id: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  logger.start('removing jobs...');
  try {
    if (id === 'all') {
      id = undefined;
    }
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
  } catch (err) {
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

async function run(filename: string, opts: any): Promise<JobResp> {
  const client = initClient(opts.host, opts.port);
  let config: any;
  if (!isAbsolute(filename)) {
    filename = join(process.cwd(), filename);
  }
  logger.start(`run pipeline from ${filename}`);
  try {
    config = await fs.readJson(filename);
  } catch (err) {
    logger.fail(`read pipeline config file error: ${err.message}`);
  }
  try {
    logger.info('start to create pipeline');
    const pipeline = await client.pipeline.create(config);
    logger.success(`pipeline is created: ${pipeline.id}, installing`);
    const installingResp = await client.pipeline.install(pipeline.id, { pyIndex: opts.tuna ? tunaMirrorURI : undefined });
    await client.pipeline.traceEvent(installingResp.traceId, traceLogger);
    logger.success('pipeline installed successfully, start to run job');
    const jobRunning = await client.job.run(pipeline.id);
    logger.success(`job is created: ${jobRunning.id}, running`);
    await client.pipeline.traceEvent(jobRunning.traceId, traceLogger);
    const job = await client.job.get(jobRunning.id);
    if (job.status === PipelineStatus.SUCCESS) {
      logger.success('job is finished successfully');
      return job;
    } else if (job.status === PipelineStatus.FAIL) {
      logger.fail(`job is failed: ${job.error}`);
    } else {
      logger.fail(`invalid job status: ${job.status}`);
    }
  } catch (err) {
    logger.fail(`something wrong when running job: ${err.message}`);
  }
}

export async function start(filename: string, opts: any): Promise<void> {
  await run(filename, opts);
}

async function runAndDownload (filename: string, opts: any) {
  const job = await run(filename, opts);
  const client = initClient(opts.host, opts.port);
  const outputRootPath = join(process.cwd(), opts.output || 'output');
  logger.info(`start to download output to ${outputRootPath}`);
  // remove the output dir
  await fs.remove(outputRootPath);
  try {
    // generate output
    const fileDownloadResp = await client.job.downloadOutput(job.id);
    await extractToPath(fileDownloadResp.stream, outputRootPath);
    logger.success('download finished');
  } catch (err) {
    logger.fail(err.message);
  }
}

program
  .command('list')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list)
  .description('list all jobs');

program
  .command('run <pipeline>')
  .option('--verbose', 'prints verbose logs', true)
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
