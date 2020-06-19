#!/usr/bin/env node

import program from 'commander';
import * as path from 'path';
import { ChildProcess } from 'child_process';
import { get, post, put, del, listen } from '../request';
import { route } from '../router';
import { ora, parseConfigFilename } from '../utils';
import { tunaMirrorURI } from '../config';

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
  ora().succeed(`pipeline ${pipeline.id} created.`);
}

async function update(id: string, filename: string): Promise<void> {
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename);
  }
  const pipeline = await put(`${route.pipeline}/${id}`, {
    config: filename
  });
  ora().succeed(`pipeline ${pipeline.id} updated with ${filename}.`);
}

async function remove(id?: any): Promise<void> {
  const spinner = ora();
  if (typeof id === 'string' && id !== 'all') {
    await del(`${route.pipeline}/${id}`);
    spinner.succeed(`pipeline ${id} has removed.`);
  } else {
    const n = await del(route.pipeline);
    spinner.succeed(`${n} pipelines has removed.`);
  }
}

async function install(filename: string, opts: any): Promise<void> {
  const spinner = ora();

  try {
    filename = await parseConfigFilename(filename);
  } catch (err) {
    spinner.fail(err.message);
    return process.exit(1);
  }
  const params = {
    cwd: process.cwd(),
    config: filename,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  if (!opts.verbose) {
    get(`${route.pipeline}/install`, params);
    spinner.succeed(`install plugins succeeded.`);
    process.exit(0);
  } else {
    await listen(`${route.pipeline}/install`, params, {
      'info': (e: MessageEvent) => {
        const info = JSON.parse(e.data);
        spinner.succeed(info);
      },
      'installed': (e: MessageEvent) => {
        const plugin = JSON.parse(e.data);
        spinner.succeed(`plugin (${plugin.name}@${plugin.version}) is installed`);
      },
      'finished': () => {
        spinner.succeed('all plugins installed');
        process.exit(0);
      },
      'error': (e: MessageEvent) => {
        spinner.fail(`occurrs an error ${e.data}`);
        process.exit(1);
      }
    });
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
  .option('--verbose', 'prints verbose logs')
  .option('--tuna', 'use tuna mirror to install python packages')
  .action(install)
  .description('install the plugins from a pipeline config file or url');

program.parse(process.argv);
