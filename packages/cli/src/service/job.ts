import { join, isAbsolute } from 'path';
import * as fs from 'fs-extra';
import { PipelineStatus } from '@pipcook/pipcook-core';
import { JobStatusValue, JobResp } from '@pipcook/sdk';
import { getFile } from '../utils/request';
import { installPackageFromConfig } from './pipeline';
import { tunaMirrorURI } from '../config';
import { logger, initClient, traceLogger, extractToPath, parseConfigFilename, streamToJson } from '../utils/common';

export async function list(opts: any): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  const jobs = await client.job.list();
  if (jobs.length > 0) {
    console.table(jobs.map((job) => {
      return { ...job, status: JobStatusValue[job.status] };
    }), [ 'id', 'status', 'evaluatePass', 'createdAt' ]);
  } else {
    logger.info('no job is created.');
  }
}

export async function remove(id: string, opts: any): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  logger.start('removing jobs...');
  try {
    if (id === 'all') {
      id = undefined;
    }
    await client.job.remove(id);
    logger.success('remove jobs successfully');
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function stop(id: string, opts: any): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  logger.start('stopping jobs...');
  try {
    await client.job.cancel(id);
    logger.success('stop job successfully');
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function log(id: string, opts: any): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  try {
    const log = await client.job.log(id);
    logger.info(log);
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function run(filename: string, opts: any): Promise<JobResp> {
  const client = initClient(opts.hostIp, opts.port);
  let config: any;

  logger.start(`run pipeline from ${filename}`);
  try {
    const fileUrl = await parseConfigFilename(filename);
    if (fileUrl.protocol === 'file:') {
      if (!isAbsolute(filename)) {
        filename = join(process.cwd(), filename);
      }
      try {
        config = await fs.readJson(filename);
        if (typeof config?.plugins !== 'object') {
          throw new Error('pipeline config file format error');
        }
      } catch (err) {
        logger.fail(`read pipeline config file error: ${err.message}`);
      }
    } else if ([ 'http:', 'https:' ].indexOf(fileUrl.protocol) >= 0) {
      logger.start('downloading pipeline config file');
      try {
        const stream = await getFile(filename);
        config = await streamToJson(stream);
      } catch (err) {
        logger.fail(`fetch config failed: ${err.message}`);
      }
    } else {
      logger.fail('unsupported file uri');
    }

    await installPackageFromConfig(config, opts);
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
    logger.fail(`something wrong when run job: ${err.message}`);
  }
}

export async function runAndDownload(filename: string, opts: any) {
  const job = await run(filename, opts);
  const client = initClient(opts.hostIp, opts.port);
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
