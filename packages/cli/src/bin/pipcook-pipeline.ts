#!/usr/bin/env node

import program from 'commander';
import * as path from 'path';
import { readJson } from 'fs-extra';
import { install } from '../pipeline';
import { logger, initClient } from '../utils';

async function list(opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  let pipelines = await client.pipeline.list();
  if (pipelines.length > 0) {
    console.table(pipelines, [ 'id', 'name', 'updatedAt', 'createdAt' ]);
  } else {
    console.info('no pipeline is created.');
  }
}

async function info(id: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  try {
    const pipeline = await client.pipeline.get(id);
    console.info(JSON.stringify(pipeline, null, 2));
  } catch (err) {
    logger.fail(err.message);
  }
}

async function create(filename: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename);
  }
  const config = await readJson(filename);
  try {
    const pipeline = await client.pipeline.create(config, { name: opts.name });
    logger.success(`pipeline ${pipeline.id} created.`);
  } catch (err) {
    logger.fail(err.message);
  }
}

async function update(id: string, filename: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename);
  }
  const config = await readJson(filename);
  try {
    const pipeline = await client.pipeline.update(id, config);
    logger.success(`pipeline ${pipeline.id} updated with ${filename}.`);
  } catch (err) {
    logger.fail(err.message);
  }
}

async function remove(id: any, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  try {
    if (id === 'all') {
      id = undefined;
    }
    await client.pipeline.remove(id);
    logger.success(id ? `pipeline ${id} has removed.` : `all pipelines removed.`);
  } catch (err) {
    logger.fail(err.message);
  }
}

program
  .command('list')
  .description('list all pipelines')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list);

program
  .command('info <id>')
  .description('info the pipeline by its id')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(info);

program
  .command('create <file>')
  .description('create a pipeline')
  .option('-n|--name <name>', 'the pipeline name')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(create);

program
  .command('update <id> <filename>')
  .description('update a pipeline')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(update);

program
  .command('remove [id]')
  .description('remove all pipelines or specific 1 pipeline via id')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(remove);

program
  .command('install <pipeline>')
  .option('--verbose', 'prints verbose logs', true)
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(install)
  .description('install the plugins from a pipeline config file or url');

program.parse(process.argv);
