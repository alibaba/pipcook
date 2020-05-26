#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import ora from 'ora';
import { listen, get } from '../request';
import { route } from '../router';

async function install(name: string): Promise<void> {
  const spinner = ora();
  spinner.start(`fetching package info ${name}`);
  let es = await listen(`${route.plugin}/install`, { name });
  es.addEventListener('info', (e: MessageEvent) => {
    const pkg = JSON.parse(e.data);
    spinner.start(`installing ${pkg.name} from ${pkg.pipcook.source.uri}`);
  });
  es.addEventListener('installed', (e: MessageEvent) => {
    const pkg = JSON.parse(e.data);
    spinner.succeed(`${pkg.name} installed.`);
  });
  es.addEventListener('error', (e: MessageEvent) => {
    spinner.fail(`install failed with ${e?.data}`);
  });
}

async function uninstall(name: string): Promise<void> {
  const spinner = ora();
  spinner.start(`uninstalling ${name}`);
  await get(`${route.plugin}/uninstall`, { name });
  spinner.succeed(`uninstalled ${name}`);
}

async function list(opts: any): Promise<void> {
  const plugins = await get(`${route.plugin}/list`, opts) as any[];
  if (plugins.length === 0) {
    console.info('no plugin installed.');
  } else {
    console.table(plugins, [ 'name', 'version', 'category', 'datatype' ]);
  }
}

program
  .command('install <name>')
  .description('install the given plugin.')
  .action((name: string) => {
    if (name[0] === '.') {
      name = path.join(process.cwd(), name);
    }
    install(name);
  });

program
  .command('uninstall <name>')
  .description('uninstall the given plugin')
  .action(uninstall);

program
  .command('list')
  .description('list installed plugin')
  .option('-c|--category <name>', 'the plugin category')
  .option('-d|--datatype <name>', 'the plugin datatype')
  .action(list);

program.parse(process.argv);
