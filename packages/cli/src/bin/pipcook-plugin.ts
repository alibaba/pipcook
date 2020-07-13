#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import { spawnSync, SpawnOptionsWithoutStdio } from 'child_process';
import fs from 'fs-extra';
import { listen, get, post, uploadFile } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';
import { ora } from '../utils';

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

async function upload(localPluginsPath: string, opts: any): Promise<void> {
  const spinner = ora();
  spinner.start(`upload plugin: ${localPluginsPath}`);

  try {
    const pkg = await fs.readJSON(path.join(localPluginsPath, 'package.json'));
    if (!pkg?.pipcook) {
      spinner.fail('invalid plugin package');
      process.exit(1);
    }
  } catch (err) {
    spinner.fail(`read package.json error: ${err.message}`);
    process.exit(1);
  }
  const awagnOpts: SpawnOptionsWithoutStdio = { cwd: localPluginsPath };
  const output = spawnSync('npm', [ 'pack' ], awagnOpts);
  let tarball: string;
  if (output.status !== 0) {
    spinner.fail(output.stderr.toString());
    process.exit(1);
  } else {
    spinner.info(output.stdout.toString());
    tarball = output.stdout.toString().replace(/[\n\r]/g, '');
  }

  const resp = await uploadFile(`${route.plugin}/upload`, path.join(localPluginsPath, tarball));
  return new Promise((resolve, reject) => {
    listen(`${route.plugin}/log`, { id: resp.data.id }, {
      'info': (e: MessageEvent) => {
        spinner.info(e.data);
      },
      'finished': () => {
        resolve();
        process.exit(0);
      },
      'error': (e: MessageEvent) => {
        reject(new TypeError(e.data));
        process.exit(1);
      }
    });
  });
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
  .command('uninstall <name>')
  .description('uninstall the given plugin')
  .action(uninstall);

program
  .command('list')
  .description('list installed plugin')
  .option('-c|--category <name>', 'the plugin category')
  .option('-d|--datatype <name>', 'the plugin datatype')
  .action(list);

program
  .command('upload <localPluginsPath>')
  .description('unpload and install the local package.')
  .option('--tuna', 'use tuna mirror to install python packages')
  .action((localPluginsPath: string, opts: any) => {
    if (localPluginsPath[0] === '.') {
      localPluginsPath = path.join(process.cwd(), localPluginsPath);
    }
    upload(localPluginsPath, opts);
  });

program.parse(process.argv);
