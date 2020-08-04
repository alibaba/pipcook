#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import { PluginResp, TraceResp } from '@pipcook/sdk';
import { PluginStatus } from '@pipcook/pipcook-core';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import { tunaMirrorURI } from '../config';
import { logger, initClient, traceLogger } from '../utils';

async function install(name: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  let resp: TraceResp<PluginResp>;

  if (name[0] === '.') {
    name = path.join(process.cwd(), name);
  }
  try {
  // install from local package directory
    if (await fs.pathExists(name) && await (await fs.stat(name)).isDirectory()) {
      try {
        const pkg = await fs.readJSON(path.join(name, 'package.json'));
        logger.start(`installing ${pkg.name} from ${name}`);
        if (!pkg?.pipcook) {
          return logger.fail('invalid plugin package');
        }
      } catch (err) {
        return logger.fail(`read package.json error: ${err.message}`);
      }
      const output = spawnSync('npm', [ 'pack' ], { cwd: name });
      let tarball: string;
      if (output.status !== 0) {
        return logger.fail(output.stderr.toString());
      } else {
        logger.info(output.stdout.toString());
        tarball = output.stdout.toString().replace(/[\n\r]/g, '');
      }
      const fstream = fs.createReadStream(path.join(name, tarball));
      resp = await client.plugin.createByTarball(fstream, opts.tuna ? tunaMirrorURI : undefined);
    } else { // install from name, git, etc.
      logger.start(`fetching package info ${name}`);
      resp = await client.plugin.createByName(name, opts.tuna ? tunaMirrorURI : undefined);
    }
    await client.plugin.traceEvent(resp.traceId, traceLogger);
    // confirm if the plugin installed successfully
    const plugin = await client.plugin.get(resp.id);
    if (plugin) {
      if (plugin.status === PluginStatus.INSTALLED) {
        logger.success('install successfully');
      } else {
        logger.fail(plugin.error);
      }
    } else {
      logger.fail('something wrong happened');
    }
  } catch (err) {
    logger.fail(err.message);
  }
}

async function uninstall(name: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  logger.start(`uninstalling ${name}`);
  const plugins = await client.plugin.list({ name });
  logger.info(plugins.length.toString());
  if (plugins.length > 0) {
    try {
      await client.plugin.remove(plugins[0].id);
      logger.success(`uninstalled ${name}`);
    } catch (err) {
      logger.fail(err.message);
    }
  } else {
    logger.fail(`not plugin found: ${name}`);
  }
}

async function list(opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  const plugins = await client.plugin.list(opts);
  if (plugins.length === 0) {
    console.info('no plugin installed.');
  } else {
    console.table(plugins, [ 'name', 'version', 'category', 'datatype' ]);
  }
}

program
  .command('install <name>')
  .description('install the given plugin.')
  .option('--tuna', 'use tuna mirror to install python packages')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action((name: string, opts: any) => {
    install(name, opts);
  });

program
  .command('uninstall <name>')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .description('uninstall the given plugin')
  .action(uninstall);

program
  .command('list')
  .description('list installed plugin')
  .option('-c|--category <name>', 'the plugin category')
  .option('-d|--datatype <name>', 'the plugin datatype')
  .option('-n|--name <name>', 'the plugin package name')
  .option('-h|--host <host>', 'the host of daemon')
  .option('-p|--port <port>', 'the port of daemon')
  .action(list);

program.parse(process.argv);
