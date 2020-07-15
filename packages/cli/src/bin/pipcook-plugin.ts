#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import { listen, get, uploadFile } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';
import { ora, abort } from '../utils';

async function install(name: string, opts: any): Promise<void> {
  if (name.startsWith('.') || path.isAbsolute(name)) {
    await upload(name, opts);
  } else {
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
        abort(spinner, `install failed with ${e?.data}`);
      }
    });
  }
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
  try {
    const pkg = await fs.readJSON(path.join(localPluginsPath, 'package.json'));
    spinner.start(`installing ${pkg.name} from ${localPluginsPath}`);
    if (!pkg?.pipcook) {
      return abort(spinner, 'invalid plugin package');
    }
  } catch (err) {
    return abort(spinner, `read package.json error: ${err.message}`);
  }
  const params = {
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  const output = spawnSync('npm', [ 'pack' ], { cwd: localPluginsPath });
  let tarball: string;
  if (output.status !== 0) {
    return abort(spinner, output.stderr.toString());
  } else {
    spinner.info(output.stdout.toString());
    tarball = output.stdout.toString().replace(/[\n\r]/g, '');
  }

  const resp = await uploadFile(`${route.plugin}/upload`, path.join(localPluginsPath, tarball), params);
  spinner.info(`installing plugin ${resp.data?.plugin?.name}@${resp.data?.plugin?.version}`);
  return new Promise((resolve) => {
    listen(`${route.plugin}/log/${resp.data.logId}`, {}, {
      'info': (e: MessageEvent) => {
        spinner.info(e.data);
      },
      'error': (e: MessageEvent) => {
        spinner.warn(e.data);
      },
      'fail': (e: MessageEvent) => {
        abort(spinner, e.data);
      },
      'finished': (e: MessageEvent) => {
        resolve();
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

program.parse(process.argv);
