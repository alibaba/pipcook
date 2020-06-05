#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import ora from 'ora';
import { listen, get } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';
import * as url from 'url';
import { existsSync } from 'fs';
import { ChildProcess } from 'child_process';

async function install(name: string, opts: any): Promise<void> {
  const spinner = ora();
  spinner.start(`fetching package info ${name}`);

  const params = {
    name,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  await listen(`${route.plugin}/install`, params, {
    'info': (e: MessageEvent) => {
      const pkg = JSON.parse(e.data);
      spinner.start(`installing ${pkg.name} from ${pkg.pipcook.source.uri}`);
    },
    'installed': (e: MessageEvent) => {
      const pkg = JSON.parse(e.data);
      spinner.succeed(`${pkg.name} installed.`);
    },
    'error': (e: MessageEvent) => {
      spinner.fail(`install failed with ${e?.data}`);
    }
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
async function installFromConfig(filename: string, opts: any): Promise<void> {
  const spinner = ora();
  if (!filename) {
    spinner.fail('Please specify the config path');
    return process.exit(1);
  }
  let urlObj = url.parse(filename);
  // file default if the protocol is null
  if (urlObj.protocol === null) {
    filename = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
    // check the filename existence
    if (!existsSync(filename)) {
      spinner.fail(`${filename} not exists`);
      return process.exit(1);
    } else {
      filename = url.parse(`file://${filename}`).href;
    }
  } else if ([ 'http:', 'https:' ].indexOf(urlObj.protocol) === -1) {
    spinner.fail(`protocol ${urlObj.protocol} is not supported`);
    return process.exit(1);
  }

  const params = {
    cwd: process.cwd(),
    config: filename,
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  if (!opts.verbose) {
    await get(`${route.plugin}/installFromConfig`, params);
    spinner.succeed(`install plugins succeeded.`);
  } else {
    let stdout: ChildProcess, stderr: ChildProcess;
    await listen(`${route.plugin}/installFromConfig`, params, {
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
        stdout?.kill();
        stderr?.kill();
        process.exit(0);
      },
      'error': (e: MessageEvent) => {
        spinner.fail(`occurrs an error ${e.data}`);
        stdout?.kill();
        stderr?.kill();
        process.exit(1);
      }
    });
  }
}
program
  .command('install <name>')
  .description('install the given plugin.')
  .option('--tuna', 'use tuna mirror to install python packages')
  .action((name: string, opts: any) => {
    if (name[0] === '.') {
      name = path.join(process.cwd(), name);
    }
    install(name, opts);
  });
program
  .command('installFromConfig <pipeline>')
  .option('--verbose', 'prints verbose logs')
  .option('--tuna', 'use tuna mirror to install python packages')
  .action(installFromConfig)
  .description('install the plugins from a pipeline config file or url');
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
