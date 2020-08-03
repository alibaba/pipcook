import { PipelineResp } from '@pipcook/sdk';
import { constants, PluginStatus } from '@pipcook/pipcook-core';
import { logger, parseConfigFilename, initClient } from "./utils";
import { tunaMirrorURI } from "./config";
import { readJson } from 'fs-extra';

const PluginStatusStr = [ 'installing', 'installed', 'failed' ];

export async function install(filename: string, opts: any): Promise<void> {
  const client = initClient(opts.host, opts.port);
  logger.start(`start install pipeline from ${filename}`);
  try {
    filename = await parseConfigFilename(filename);
  } catch (err) {
    return logger.fail(err.message);
  }
  let pipeline: PipelineResp;
  try {
    if (filename.startsWith('http')) {
      pipeline = await client.pipeline.createByUri(filename);
    } else {
      const config = await readJson(filename);
      pipeline = await client.pipeline.create(config);
    }
    const installingResp = client.pipeline.install(pipeline.id, { pyIndex: opts.tuna ? tunaMirrorURI : undefined });
    client.pipeline.traceEvent((await installingResp).traceId, (event: string, data: any) => {
      if (event === 'log') {
        if (data.level === 'info') {
          logger.info(data.data);
        } else if (data.level === 'warn') {
          logger.warn(data.data);
        }
      }
    });
    let isSuccess = true;
    await constants.PLUGINS.forEach(async (plugin) => {
      if (!pipeline[plugin]) {
        return logger.info(`${plugin} plugin is not configured`);
      }
      const plugins = await client.plugin.list({ name: pipeline[plugin] });
      if (plugins.length > 0) {
        if (plugins[0].status === PluginStatus.INSTALLED) {
          logger.success(`${pipeline[plugin]} installed.`);
        } else {
          isSuccess = false;
          logger.fail(`${pipeline[plugin]} ${PluginStatusStr[plugins[0].status]}.`, false);
        }
      }
    });
    if (isSuccess) {
      logger.success('pipeline installed successfully.');
    } else {
      logger.fail('pipeline installed field');
    }
  } catch (err) {
    logger.fail(`install pipeline error: ${err.message}`);
  }
}
