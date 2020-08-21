import path from 'path';
import { PluginResp, TraceResp, PluginStatusValue } from '@pipcook/sdk';
import { PluginStatus } from '@pipcook/pipcook-core';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import { tunaMirrorURI } from '../config';
import { logger, initClient, traceLogger } from '../utils/common';

/**
 * trace install event
 * this function throws error
 * @param traceObj trace object
 * @param opts opts from args
 */
async function traceInstallEvent(traceObj: TraceResp<PluginResp>, opts: any): Promise<PluginResp> {
  const client = initClient(opts.hostIp, opts.port);
  if (traceObj.status === PluginStatus.INSTALLED) {
    return traceObj as PluginResp;
  }
  await client.plugin.traceEvent(traceObj.traceId, traceLogger);
  // confirm if the plugin installed successfully
  const plugin = await client.plugin.get(traceObj.id);
  if (plugin) {
    if (plugin.status === PluginStatus.INSTALLED) {
      logger.success('install successfully');
      return plugin;
    } else {
      throw new Error(`plugin install failed: ${plugin.error}`);
    }
  } else {
    throw new Error('can\'t find the plugin after installation');
  }
}

/**
 * install the package from local path
 * this function throws error
 * @param localPath package local path
 * @param opts opts from args
 */
export async function installFromLocal(localPath: string, opts: any): Promise<PluginResp> {
  const client = initClient(opts.hostIp, opts.port);
  let pkg: any;
  try {
    pkg = await fs.readJSON(path.join(localPath, 'package.json'));
    logger.start(`installing ${pkg.name} from ${localPath}`);
  } catch (err) {
    throw new TypeError(`read package.json error: ${err.message}`);
  }
  if (!pkg?.pipcook) {
    throw new TypeError('invalid plugin package');
  }
  const output = spawnSync('npm', [ 'pack' ], { cwd: localPath });
  let tarball: string;
  if (output.status !== 0) {
    throw new TypeError(`read local package error: ${output.stderr.toString()}`);
  } else {
    tarball = output.stdout.toString().replace(/[\n\r]/g, '');
  }
  const fstream = fs.createReadStream(path.join(localPath, tarball));
  const resp = await client.plugin.createByTarball(fstream, opts.tuna ? tunaMirrorURI : undefined);
  await fs.remove(path.join(localPath, tarball));
  if (resp.status === PluginStatus.INSTALLED) {
    logger.success(`${pkg.name} already installed`);
    return resp;
  } else {
    const plugin = await traceInstallEvent(resp, opts);
    logger.success(`install ${pkg.name}@${pkg.version} successfully`);
    return plugin;
  }
}

export async function installFromUri(uri: string, opts: any): Promise<PluginResp> {
  const client = initClient(opts.hostIp, opts.port);
  logger.start(`fetching package info ${uri}`);
  const resp = await client.plugin.createByName(uri, opts.tuna ? tunaMirrorURI : undefined);
  return await traceInstallEvent(resp, opts);
}

export async function install(name: string, opts: any): Promise<PluginResp> {
  logger.start(`installing plugin ${name}`);
  if (name[0] === '.') {
    name = path.join(process.cwd(), name);
  }
  try {
    if (await fs.pathExists(name) && (await fs.stat(name)).isDirectory()) {
      // install from local package directory
      return await installFromLocal(name, opts);
    } else {
      // install from package name, git, etc.
      return await installFromUri(name, opts);
    }
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function uninstall(name: string, opts: any): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
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
  const client = initClient(opts.hostIp, opts.port);
  const plugins = await client.plugin.list(opts);
  if (plugins.length === 0) {
    logger.info('no plugin installed.');
  } else {
    console.table(plugins.map((plugin) => {
      return { ...plugin, status: PluginStatusValue[plugin.status] };
    }), [ 'name', 'version', 'category', 'datatype', 'status' ]);
  }
}
