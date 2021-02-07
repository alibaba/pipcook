import * as path from 'path';
import * as Url from 'url';
import { PipelineResp, PluginStatusValue, PipelineConfig, JobResp } from '@pipcook/sdk';
import { constants, PluginStatus } from '@pipcook/pipcook-core';
import { readJson } from 'fs-extra';
import { install as pluginInstall } from './plugin';
import { logger, parseConfigFilename, initClient, streamToJson } from '../utils/common';
import { getFile } from '../utils/request';
import { CommonOptions, PipelineCreateOptions, PluginInstallOptions } from '../types/options';

export async function list(opts: CommonOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  let pipelines = await client.pipeline.list();
  if (pipelines.length > 0) {
    console.table(pipelines, [ 'id', 'name', 'updatedAt', 'createdAt' ]);
  } else {
    console.info('no pipeline is created.');
  }
}

export async function info(id: string, opts: CommonOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  try {
    const pipeline = await client.pipeline.getConfig(id);
    console.info(JSON.stringify(pipeline, null, 2));
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function create(filename: string, opts: PipelineCreateOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename);
  }
  const config = await readJson(filename);
  try {
    const pipeline = await client.pipeline.create(config, { name: opts.name });
    logger.success(`pipeline ${pipeline.id} created.`);
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function update(id: string, filename: string, opts: CommonOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  if (!path.isAbsolute(filename)) {
    filename = path.join(process.cwd(), filename);
  }
  const config = await readJson(filename);
  try {
    await client.pipeline.update(id, config);
    const pipeline = await client.pipeline.get(id);
    logger.success(`pipeline ${pipeline.id} updated with ${filename}.`);
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function listJobsByPipelineId(id: string, opts: CommonOptions): Promise<JobResp[]> {
  const client = initClient(opts.hostIp, opts.port);
  let jobs;
  if (id === undefined) {
    jobs = await client.job.list();
  } else {
    jobs = await client.job.list({ where: { pipelineId: id } });
  }
  return jobs;
}

export async function remove(id: string, jobs: JobResp[], opts: CommonOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  try {
    await client.pipeline.remove(id);
    logger.info(`${jobs.length} ${jobs.length > 1 ? 'jobs' : 'job'} removed.`);
    logger.success(id ? `pipeline ${id} has removed.` : `all pipelines removed.`);
  } catch (err) {
    logger.fail(err.message);
  }
}

export async function installPackageFromConfig(config: Record<string, any>, opts: PluginInstallOptions): Promise<void> {
  for (const plugin of constants.PLUGINS) {
    const packageName = config.plugins[plugin]?.package;
    if (typeof packageName === 'string') {
      const pkg = await pluginInstall(packageName, opts);
      config.plugins[plugin].package = pkg.name;
    }
  }
}

export async function install(filename: string, opts: PluginInstallOptions): Promise<void> {
  const client = initClient(opts.hostIp, opts.port);
  logger.start(`start install pipeline from ${filename}`);
  let fileUrl;
  try {
    fileUrl = await parseConfigFilename(filename);
    filename = fileUrl.href;
  } catch (err) {
    return logger.fail(err.message);
  }
  let pipeline: PipelineResp;
  try {
    if (fileUrl.protocol === 'file:') {
      const url = Url.parse(filename);
      const config = await readJson(url.path);
      logger.start('installing plugins');
      await installPackageFromConfig(config, opts);
      logger.info('start to create pipeline');
      pipeline = await client.pipeline.create(config);
      logger.success(`pipeline is created: ${pipeline.id}`);
    } else {
      logger.start(`downloading pipeline config file form ${filename}`);
      const stream = await getFile(filename);
      const config = await streamToJson(stream) as PipelineConfig;
      logger.start('installing plugins');
      await installPackageFromConfig(config, opts);
      logger.info('start to create pipeline');
      pipeline = await client.pipeline.create(config);
      logger.success(`pipeline is created: ${pipeline.id}`);
    }
    // check the installation
    logger.info('check plugin:');
    let isSuccess = true;
    await Promise.all(constants.PLUGINS.map(async (plugin) => {
      // if use pipeline[plugin], error throw:
      // TS2536: Type 'PluginTypeI' cannot be used to index type 'PipelineResp'.
      const pluginName = (pipeline as any)[plugin];
      if (!pluginName) {
        return;
      }
      const plugins = await client.plugin.list({ name: pluginName });
      if (plugins.length > 0 && plugins[0].status === PluginStatus.INSTALLED) {
        logger.success(`${pluginName} installed.`);
      } else {
        isSuccess = false;
        logger.fail(`${pluginName} ${PluginStatusValue[plugins[0]?.status || PluginStatus.FAILED]}.`, false);
      }
    }));
    if (isSuccess) {
      logger.success('pipeline installed successfully.');
    } else {
      logger.fail('pipeline installed field');
    }
  } catch (err) {
    logger.fail(`install pipeline error: ${err.message}`);
  }
}
