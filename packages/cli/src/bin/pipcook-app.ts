#!/usr/bin/env node

import program from 'commander';
import { ora } from '../utils';
import { AppProject } from '../app';
import { PipelineStatus } from '@pipcook/pipcook-core';
import { getFile } from '../request';

program
  .command('compile <script.ts>')
  .description('compile the PipApp Script.')
  .action(async (srcPath) => {
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();
    await app.compileAndSave();

    const { pipelineIds } = app.manifest;
    console.info(`generated ${pipelineIds.length} pipelines, please click the following links to config them:`);
    pipelineIds.forEach((id: string) => {
      console.info(`(${id}) > http://localhost:6927/index.html#/pipeline/info?pipelineId=${id}`)
    });
  });

program
  .command('train <script.ts>')
  .description('start training the configured PipApp Script.')
  .action(async (srcPath) => {
    const spinner = ora();
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();

    try {
      // ensure all plugins.
      spinner.info(`checking and installing plugins for "${srcPath}"`);
      await app.ensureAllPlugins({
        before: async (name: string, version: string): Promise<void> => {
          spinner.start(`installing plugin ${name}@${version}`);
        },
        after: async (name: string, version: string): Promise<void> => {
          spinner.succeed(`${name}@${version} is installed.`);
        }
      });
      spinner.info('all plugins are installed.');

      // and start running pipelines one by one.
      await app.train({
        before: async (id: string): Promise<void> => {
          spinner.start(`start running the pipeline(${id})`);
        },
        after: async (id: string, jobId: string): Promise<void> => {
          spinner.succeed(`pipeline is scheduled at job(${jobId})`);
        }
      });
    } catch (err) {
      spinner.fail(err.message);
      process.exit(1);
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
  .command('generate <script.ts>')
  .description('generate the executable from trained PipApp Project.')
  .action(async (srcPath) => {
    const app = new AppProject(srcPath);
    await app.initializeOrLoad();
    try {
      await app.generateExecutable();
    } catch (err) {
      console.error(err.message);
    }
  });

program.parse(process.argv);
