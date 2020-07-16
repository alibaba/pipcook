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
  let stat: fs.Stats;
  try {
    stat = await fs.stat(name);
  } catch (err) {
    // ignore this error, we just test if name is a local directory
  }
  if (stat?.isDirectory) {
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

async function upload(pathname: string, opts: any): Promise<void> {
  const spinner = ora();
  try {
    const pkg = await fs.readJSON(path.join(pathname, 'package.json'));
    spinner.start(`installing ${pkg.name} from ${pathname}`);
    if (!pkg?.pipcook) {
      return abort(spinner, 'invalid plugin package');
    }
  } catch (err) {
    return abort(spinner, `read package.json error: ${err.message}`);
  }
  const params = {
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  const output = spawnSync('npm', [ 'pack' ], { cwd: pathname });
  let tarball: string;
  if (output.status !== 0) {
    return abort(spinner, output.stderr.toString());
  } else {
    spinner.info(output.stdout.toString());
    tarball = output.stdout.toString().replace(/[\n\r]/g, '');
  }

  const resp = await uploadFile(`${route.plugin}/upload`, path.join(pathname, tarball), params);
  console.log(resp);
  spinner.info(`installing plugin ${resp.data?.plugin.name}@${resp.data?.plugin.version}`);
  let errMsg: string;
  await new Promise((resolve) => {
    listen(`${route.plugin}/log/${resp.data.logId}`, {}, {
      'log': (e: MessageEvent) => {
        const log = JSON.parse(e.data);
        switch (log.level) {
        case 'info':
          spinner.info(log.data);
          break;
        case 'warn':
          spinner.warn(log.data);
          break;
        default:
          spinner.info(e.data.data);
        }
      },
      'error': (e: MessageEvent) => {
        errMsg = e.data;
        resolve();
      },
      'finished': () => {
        resolve();
      }
    });
  });
  const pluginInfoResp = await get(`${route.plugin}/${resp.data.plugin.id}`);
  if (typeof pluginInfoResp?.id === 'string') {
    spinner.info(`install plugin ${pluginInfoResp.name}@${pluginInfoResp.version} successfully`);
  } else {
    if (errMsg) {
      abort(spinner, `install plugin failed with error: ${errMsg}`);
    } else {
      abort(spinner, 'install plugin failed');
    }
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
