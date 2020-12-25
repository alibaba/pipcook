import * as path from 'path';
import { PluginResp, TraceResp, PluginStatusValue } from '@pipcook/sdk';
import { PluginStatus } from '@pipcook/pipcook-core';
import { spawnSync } from 'child_process';
import * as fs from 'fs-extra';
import { tunaMirrorURI } from '../config';
import { logger, initClient, traceLogger, readPkgFromTgz } from '../utils/common';
import { CommonOptions, PluginInstallOptions, ListPluginOptions } from '../types/options';

/**
 * trace install event
 * this function throws error
 * @param traceObj trace object
 * @param opts opts from args
 */
async function traceInstallEvent(traceObj: TraceResp<PluginResp>, opts: CommonOptions): Promise<PluginResp> {
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
export async function installFromLocal(localPath: string, opts: PluginInstallOptions): Promise<PluginResp> {
  const client = initClient(opts.hostIp, opts.port);
  let tarball: string;
  let pkg: any;
  const isDirectory = (await fs.stat(localPath)).isDirectory();
  if (!isDirectory && path.extname(localPath) !== '.tgz') {
    logger.fail('invalid local plugin path, it should be a plugin project directory or a tarball');
  }
  try {
    if (isDirectory) {
      pkg = await fs.readJSON(path.join(localPath, 'package.json'));
      if (!pkg?.pipcook) {
        throw new TypeError('invalid plugin package');
      }
      const output = spawnSync('npm', [ 'pack' ], { cwd: localPath });
      logger.start(`installing ${pkg.name} from ${localPath}`);
      if (output.status !== 0) {
        throw new TypeError(`read local package error: ${output.stderr.toString()}`);
      } else {
        tarball = path.join(localPath, output.stdout.toString().replace(/[\n\r]/g, ''));
      }
    } else {
      pkg = await readPkgFromTgz(localPath);
      if (!pkg?.pipcook) {
        throw new TypeError('invalid plugin package');
      }
      logger.start(`installing ${pkg.name} from ${localPath}`);
      tarball = localPath;
    }
  } catch (err) {
    throw new TypeError(`read package.json error: ${err.message}`);
  }
  const fstream = fs.createReadStream(tarball);
  const resp = await client.plugin.createByTarball(fstream, opts.tuna ? tunaMirrorURI : undefined);
  if (isDirectory) {
    await fs.remove(tarball);
  }
  if (resp.status === PluginStatus.INSTALLED) {
    logger.success(`${pkg.name} already installed`);
    return resp;
  } else {
    const plugin = await traceInstallEvent(resp, opts);
    logger.success(`install ${pkg.name}@${pkg.version} successfully`);
    return plugin;
  }
}

export async function installFromRemote(uriOrName: string, opts: PluginInstallOptions): Promise<PluginResp> {
  const client = initClient(opts.hostIp, opts.port);
  logger.start(`fetching package info ${uriOrName}`);
  const resp = await client.plugin.createByName(uriOrName, opts.tuna ? tunaMirrorURI : undefined);
  if (resp.status === PluginStatus.INSTALLED) {
    logger.success(`plugin ${resp.name}@${resp.version} has already been installed`);
    return resp;
  }
  if (resp.traceId) {
    await traceInstallEvent(resp, opts);
  }
  const plugin = await client.plugin.get(resp.id);
  if (plugin.status !== PluginStatus.INSTALLED) {
    throw new TypeError(`Plugin ${plugin.name} install failed`);
  }
  logger.success(`install ${resp.name}@${resp.version} successfully`);
  return plugin;
}

export async function install(name: string, opts: PluginInstallOptions): Promise<PluginResp> {
  logger.start(`installing plugin ${name}`);
  if (name[0] === '.') {
    name = path.join(process.cwd(), name);
  }
  try {
    if (await fs.pathExists(name)) {
      // install from local package directory
      return await installFromLocal(name, opts);
    } else {
      // install from package name, git, etc.
      return await installFromRemote(name, opts);
    }
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function uninstall(name: string, opts: CommonOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  logger.start(`uninstalling ${name}`);
  const plugins = await client.plugin.list({ name });
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

export async function list(opts: ListPluginOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  const plugins = await client.plugin.list(opts);
  if (plugins.length === 0) {
    logger.info('no plugin installed.');
  } else {
    console.table(plugins.map((plugin) => {
      return { ...plugin, status: PluginStatusValue[plugin.status] };
    }), [ 'id', 'name', 'version', 'category', 'datatype', 'status' ]);
  }
}

export async function info(id: string, opts: CommonOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  try {
    const plugin = await client.plugin.get(id);
    console.log(JSON.stringify(plugin, undefined, 2));
  } catch (err) {
    logger.fail(err.message);
  }
}
