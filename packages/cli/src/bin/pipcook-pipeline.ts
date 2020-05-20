#!/usr/bin/env node

import program from 'commander';
import ora from 'ora';
import * as path from 'path';
import { getPipelines, createPipeline, updatePipeline, deletePipeline, getPipelineInfo } from '../service/pipeline';

const spinner = ora();

async function list(): Promise<void> {
  const list = await getPipelines();
  const outputs = list.rows.map((row: Record<'id' | 'name' | 'updatedAt' | 'createdAt', any>) => {
    const rowPost = {
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
    return rowPost;
  });
  console.table(outputs);
}

async function info(id: string): Promise<void> {
  const data = await getPipelineInfo(id);
  console.log(JSON.stringify(data, null, 2));
}

async function create(id: string): Promise<void> {
  const data = await createPipeline(path.isAbsolute(id) ? id : path.join(process.cwd(), id));
  spinner.succeed(`create pipeline ${data.id} succeeded`);
}

async function update(id: string, source: string): Promise<void> {
  const data = await updatePipeline(source, path.isAbsolute(id) ? id : path.join(process.cwd(), id));
  spinner.succeed(`update pipeline ${data.id} succeeded`);
}

async function remove(id: string): Promise<void> {
  await deletePipeline(id);
  spinner.succeed(`remove pipeline ${id} succeeded`);
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
  .action(create);

program
  .command('update <file> <id>')
  .description('update a pipeline')
  .action(update);

program
  .command('remove <id>')
  .description('remove a pipeline')
  .action(remove);

program.parse(process.argv);
