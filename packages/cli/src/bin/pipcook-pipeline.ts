#!/usr/bin/env node

import program from 'commander';
import * as path from 'path';
import { install } from '../pipeline';
import { get, post, put, del } from '../request';
import { route } from '../router';
import { logger } from '../utils';

async function list(): Promise<void> {
  let pipelines = (await get(`${route.pipeline}/list`)).rows;
  if (pipelines.length > 0) {
    console.table(pipelines, [ 'id', 'name', 'updatedAt', 'createdAt' ]);
  } else {
    console.info('no pipeline is created.');
  }
}

async function info(id: string): Promise<void> {
  const pipeline = await get(`${route.pipeline}/info/${id}`);
  console.info(JSON.stringify(pipeline, null, 2));
}

async function create(filename: string, opts: any): Promise<void> {
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename);
  }
  const pipeline = await post(`${route.pipeline}`, {
    config: filename,
    name: opts.name
  });
  logger.success(`pipeline ${pipeline.id} created.`);
}

async function update(id: string, filename: string): Promise<void> {
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename);
  }
  const pipeline = await put(`${route.pipeline}/${id}`, {
    config: filename
  });
  logger.success(`pipeline ${pipeline.id} updated with ${filename}.`);
}

async function remove(id?: any): Promise<void> {
  if (typeof id === 'string' && id !== 'all') {
    await del(`${route.pipeline}/${id}`);
    logger.success(`pipeline ${id} has removed.`);
  } else {
    const n = await del(route.pipeline);
    logger.success(`${n} pipelines has removed.`);
  }
}

program
  .command('list')
  .description('list all pipelines')
  .action(list);

program
  .command('info <id>')
  .description('info the pipeline by its id')
  .action(info);

program
  .command('create <file>')
  .description('create a pipeline')
  .option('-n|--name <name>', 'the pipeline name')
  .action(create);

program
  .command('update <id> <filename>')
  .description('update a pipeline')
  .action(update);

program
  .command('remove [id]')
  .description('remove all pipelines or specific 1 pipeline via id')
  .action(remove);

program
  .command('install <pipeline>')
  .option('--verbose', 'prints verbose logs', true)
  .option('--tuna', 'use tuna mirror to install python packages')
  .action(install)
  .description('install the plugins from a pipeline config file or url');

program.parse(process.argv);
