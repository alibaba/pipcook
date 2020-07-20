#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import { listen, get, uploadFile } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';
import { logStart, logSuccess, logInfo, logWarn, abort } from '../utils';

async function install(name: string, opts: any): Promise<void> {
  if (await fs.pathExists(name) && await (await fs.stat(name)).isDirectory()) {
    await upload(name, opts);
  } else {
    logStart(`fetching package info ${name}`);

    const params = {
      name,
      pyIndex: opts.tuna ? tunaMirrorURI : undefined
    };
    await listen(`${route.plugin}/install`, params, {
      'info': (e: MessageEvent) => {
        const pkg = JSON.parse(e.data);
        logStart(`installing ${pkg.name} from ${pkg.pipcook.source.uri}`);
      },
      'installed': (e: MessageEvent) => {
        const pkg = JSON.parse(e.data);
        logSuccess(`${pkg.name} installed.`);
      },
      'error': (e: MessageEvent) => {
        abort(`install failed with ${e?.data}`);
      }
    });
  }
}

async function uninstall(name: string): Promise<void> {
  logStart(`uninstalling ${name}`);
  await get(`${route.plugin}/uninstall`, { name });
  logSuccess(`uninstalled ${name}`);
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
  try {
    const pkg = await fs.readJSON(path.join(pathname, 'package.json'));
    logStart(`installing ${pkg.name} from ${pathname}`);
    if (!pkg?.pipcook) {
      return abort('invalid plugin package');
    }
  } catch (err) {
    return abort(`read package.json error: ${err.message}`);
  }
  const params = {
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  const output = spawnSync('npm', [ 'pack' ], { cwd: pathname });
  let tarball: string;
  if (output.status !== 0) {
    return abort(output.stderr.toString());
  } else {
    logInfo(output.stdout.toString());
    tarball = output.stdout.toString().replace(/[\n\r]/g, '');
  }

  const installingResp = await uploadFile(`${route.plugin}/upload`, path.join(pathname, tarball), params);
  logInfo(`installing plugin ${installingResp.data?.name}@${installingResp.data?.version}`);
  let errMsg: string;
  await new Promise((resolve) => {
    listen(`${route.plugin}/log/${installingResp.data.logId}`, {}, {
      'log': (e: MessageEvent) => {
        const log = JSON.parse(e.data);
        switch (log.level) {
        case 'info':
          logInfo(log.data);
          break;
        case 'warn':
          logWarn(log.data);
          break;
        default:
          logInfo(e.data.data);
        }
      },
      'error': (e: MessageEvent) => {
        errMsg = e.data;
        resolve();
      },
      'finished': resolve
    });
  });
  const pluginInfoResp = await get(`${route.plugin}/${installingResp.data?.id}`);
  if (typeof pluginInfoResp?.id === 'string') {
    logInfo(`install plugin ${pluginInfoResp.name}@${pluginInfoResp.version} successfully`);
  } else {
    if (errMsg) {
      abort(`install plugin failed with error: ${errMsg}`);
    } else {
      abort('install plugin failed');
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
