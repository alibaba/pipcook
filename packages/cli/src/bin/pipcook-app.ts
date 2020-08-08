#!/usr/bin/env node

import program from 'commander';
import { logger } from '../utils/common';
import { AppProject } from '../service/app';
import { PipelineStatus } from '@pipcook/pipcook-core';

program
  .command('compile <script.ts>')
  .description('compile the PipApp Script.')
  .action(async (srcPath) => {
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();
    await app.compileAndSave();

    const { pipelines } = app.manifest;
    console.info(`generated ${pipelines.length} pipelines, please click the following links to config them:`);
    pipelines.forEach(({ id, namespace }) => {
      console.info(`(${namespace.module}.${namespace.method}) > http://localhost:6927/index.html#/pipeline/info?pipelineId=${id}`);
    });
  });

program
  .command('train <script.ts>')
  .description('start training the configured PipApp Script.')
  .action(async (srcPath) => {
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();

    try {
      // ensure all plugins.
      logger.info(`checking and installing plugins for "${srcPath}"`);
      await app.ensureAllPlugins({
        before: async (name: string, version: string): Promise<void> => {
          logger.start(`installing plugin ${name}@${version}`);
        },
        after: async (name: string, version: string): Promise<void> => {
          logger.success(`${name}@${version} is installed.`);
        }
      });
      logger.info('all plugins are installed.');

      // and start running pipelines one by one.
      await app.train({
        before: async (id: string): Promise<void> => {
          logger.start(`start running the pipeline(${id})`);
        },
        after: async (id: string, jobId: string): Promise<void> => {
          logger.success(`pipeline is scheduled at job(${jobId})`);
        }
      });
    } catch (err) {
      logger.fail(err.message);
    }
  });

program
  .command('status <script.ts>')
  .description('view status for the PipApp Script.')
  .action(async (srcPath) => {
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();

    const jobs = await app.getJobs();
    jobs.forEach((job) => {
      console.info(`job(${job.id}):`);
      console.info(`  pipeline: http://localhost:6927/index.html#/pipeline/info?pipelineId=${job.pipelineId}`);
      if (job.status === PipelineStatus.INIT) {
        console.info(`  status: initialize`);
      } else if (job.status === PipelineStatus.RUNNING) {
        console.info(`  status: running`);
      } else if (job.status === PipelineStatus.SUCCESS) {
        console.info(`  status: success`);
        console.info(`  evaluate: ${job.evaluateMap}`);
      } else if (job.status === PipelineStatus.FAIL) {
        console.info(`  status: failure`);
        console.info(`  error: ${job.error}`);
      }
    });
  });

program
  .command('build <script.ts>')
  .description('build the executable from trained PipApp Project.')
  .option('--tuna', 'use tuna mirror to download miniconda at China.')
  .action(async (srcPath, { tuna }) => {
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();
    try {
      await app.buildExecutable({ tuna });
    } catch (err) {
      console.error(err.message);
    }
  });

program.parse(process.argv);
