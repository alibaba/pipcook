import path from 'path';
import { PluginResp, TraceResp, PluginStatusValue } from '@pipcook/sdk';
import { PluginStatus } from '@pipcook/pipcook-core';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import { tunaMirrorURI } from '../config';
import { logger, initClient, traceLogger } from '../utils';

export async function installFromLocal(localPath: string, opts: any): Promise<TraceResp<PluginResp>> {
  const client = initClient(opts.host, opts.port);
  try {
    const pkg = await fs.readJSON(path.join(localPath, 'package.json'));
    logger.start(`installing ${pkg.name} from ${localPath}`);
    if (!pkg?.pipcook) {
      logger.fail('invalid plugin package');
    }
  } catch (err) {
    logger.fail(`read package.json error: ${err.message}`);
  }
  const output = spawnSync('npm', [ 'pack' ], { cwd: localPath });
  let tarball: string;
  if (output.status !== 0) {
    logger.fail(output.stderr.toString());
  } else {
    logger.info(output.stdout.toString());
    tarball = output.stdout.toString().replace(/[\n\r]/g, '');
  }
  const fstream = fs.createReadStream(path.join(localPath, tarball));
  return await client.plugin.createByTarball(fstream, opts.tuna ? tunaMirrorURI : undefined);
}

export async function install(name: string, opts: any): Promise<PluginResp> {
  const client = initClient(opts.host, opts.port);
  let resp: TraceResp<PluginResp>;

  if (name[0] === '.') {
    name = path.join(process.cwd(), name);
  }
  try {
    if (await fs.pathExists(name) && (await fs.stat(name)).isDirectory()) {
      // install from local package directory
      resp = await installFromLocal(name, opts);
    } else {
      // install from name, git, etc.
      logger.start(`fetching package info ${name}`);
      resp = await client.plugin.createByName(name, opts.tuna ? tunaMirrorURI : undefined);
    }
    if (resp.status === PluginStatus.INSTALLED) {
      logger.success('already installed');
      return resp;
    }
    await client.plugin.traceEvent(resp.traceId, traceLogger);
    // confirm if the plugin installed successfully
    const plugin = await client.plugin.get(resp.id);
    if (plugin) {
      if (plugin.status === PluginStatus.INSTALLED) {
        logger.success('install successfully');
        return plugin;
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

export async function installEntry (name: string, opts: any): Promise<void> {
  await install(name, opts);
}

export async function uninstall(name: string, opts: any): Promise<void> {
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

export async function list(opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  const plugins = await client.plugin.list(opts);
  if (plugins.length === 0) {
    console.info('no plugin installed.');
  } else {
    console.table(plugins.map((plugin) => {
      return { ...plugin, status: PluginStatusValue[plugin.status] };
    }), [ 'name', 'version', 'category', 'datatype', 'status' ]);
  }
}
