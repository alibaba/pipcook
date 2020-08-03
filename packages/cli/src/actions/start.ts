import { join, isAbsolute } from 'path';
import { readJson } from 'fs-extra';
import { PipelineStatus } from '@pipcook/pipcook-core';
import { tunaMirrorURI } from '../config';
import { StartHandler } from '../types';
import { logger, initClient } from '../utils';

function logCallback(event: string, data: any) {
  if (event === 'log') {
    if (data.level === 'info') {
      logger.info(data.data);
    } else if (data.level === 'warn') {
      logger.warn(data.data);
    }
  }
}

const start: StartHandler = async (filename: string, opts: any) => {
  const client = initClient(opts.host, opts.port);
  let config: any;
  if (!isAbsolute(filename)) {
    filename = join(process.cwd(), filename);
  }
  logger.start(`run pipeline from ${filename}`);
  try {
    config = await readJson(filename);
  } catch (err) {
    logger.fail(`read pipeline config file error: ${err.message}`);
  }
  try {
    logger.info('start to create pipeline');
    const pipeline = await client.pipeline.create(config);
    logger.info(`pipeline is created: ${pipeline.id}, installing`);
    const installingResp = await client.pipeline.install(pipeline.id, { pyIndex: opts.tuna ? tunaMirrorURI: undefined });
    await client.pipeline.traceEvent(installingResp.traceId, logCallback);
    logger.info('pipeline installed successfully, start to run job');
    const jobRunning = await client.job.run(pipeline.id);
    logger.info(`job is created: ${jobRunning.id}, running`);
    await client.pipeline.traceEvent(jobRunning.traceId, logCallback);
    const job = await client.job.get(jobRunning.id);
    if (job.status === PipelineStatus.SUCCESS) {
      logger.info('job is finished successfully');
    } else if (job.status === PipelineStatus.FAIL) {
      logger.fail(`job is failed: ${job.error}`);
    } else {
      logger.fail(`invalid job status: ${job.status}`);
    }
  } catch (err) {
    logger.fail(`something wrong when running job: ${err.message}`);
  }
};

export default start;
