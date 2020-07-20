#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import { listen, get, uploadFile } from '../request';
import { route } from '../router';
import { tunaMirrorURI } from '../config';
import { logger } from '../utils';

async function install(name: string, opts: any): Promise<void> {
  if (await fs.pathExists(name) && await (await fs.stat(name)).isDirectory()) {
    await upload(name, opts);
  } else {
    logger.start(`fetching package info ${name}`);

    const params = {
      name,
      pyIndex: opts.tuna ? tunaMirrorURI : undefined
    };
    await listen(`${route.plugin}/install`, params, {
      'info': (e: MessageEvent) => {
        const pkg = JSON.parse(e.data);
        logger.start(`installing ${pkg.name} from ${pkg.pipcook.source.uri}`);
      },
      'installed': (e: MessageEvent) => {
        const pkg = JSON.parse(e.data);
        logger.success(`${pkg.name} installed.`);
      },
      'error': (e: MessageEvent) => {
        logger.fail(`install failed with ${e?.data}`);
      }
    });
  }
}

async function uninstall(name: string): Promise<void> {
  logger.start(`uninstalling ${name}`);
  await get(`${route.plugin}/uninstall`, { name });
  logger.success(`uninstalled ${name}`);
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
    logger.start(`installing ${pkg.name} from ${pathname}`);
    if (!pkg?.pipcook) {
      return logger.fail('invalid plugin package');
    }
  } catch (err) {
    return logger.fail(`read package.json error: ${err.message}`);
  }
  const params = {
    pyIndex: opts.tuna ? tunaMirrorURI : undefined
  };
  const output = spawnSync('npm', [ 'pack' ], { cwd: pathname });
  let tarball: string;
  if (output.status !== 0) {
    return logger.fail(output.stderr.toString());
  } else {
    logger.info(output.stdout.toString());
    tarball = output.stdout.toString().replace(/[\n\r]/g, '');
  }

  const installingResp = await uploadFile(`${route.plugin}/upload`, path.join(pathname, tarball), params);
  logger.info(`installing plugin ${installingResp.data?.name}@${installingResp.data?.version}`);
  let errMsg: string;
  await new Promise((resolve) => {
    listen(`${route.plugin}/log/${installingResp.data.logId}`, {}, {
      'log': (e: MessageEvent) => {
        const log = JSON.parse(e.data);
        switch (log.level) {
        case 'info':
          logger.info(log.data);
          break;
        case 'warn':
          logger.warn(log.data);
          break;
        default:
          logger.info(e.data.data);
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
    logger.info(`install plugin ${pluginInfoResp.name}@${pluginInfoResp.version} successfully`);
  } else {
    if (errMsg) {
      logger.fail(`install plugin failed with error: ${errMsg}`);
    } else {
      logger.fail('install plugin failed');
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
