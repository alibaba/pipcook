import Queue from 'queue';
import { Context } from 'midway';
import SseStream from 'ssestream';
import * as path from 'path';
import * as fs from 'fs-extra';
import { copyFile } from 'fs';
import * as util from 'util';
import * as request from 'request-promise';
import * as url from 'url';
import {
  RunConfigI,
  generateId
} from '@pipcook/pipcook-core';
import { PipelineEntity } from './model/pipeline';

export const copyFileAsync = util.promisify(copyFile);

export class ServerSentEmitter {
  private handle: SseStream;
  private response: NodeJS.WritableStream;

  constructor(ctx: Context) {
    this.response = ctx.res as NodeJS.WritableStream;
    this.handle = new SseStream(ctx.req);
    this.handle.pipe(this.response);
    this.emit('session', 'start');
  }

  emit(event: string, data: any): boolean {
    return this.handle.write({ event, data });
  }

  finish(): void {
    this.emit('session', 'close');
    this.handle.unpipe(this.response);
  }
}

export const pluginQueue = new Queue({ autostart: true, concurrency: 1 });

export async function loadConfig(configPath: string | RunConfigI): Promise<RunConfigI> {
  if (typeof configPath === 'string') {
    let configJson: RunConfigI;
    const urlObj = url.parse(configPath);
    if (urlObj.protocol === null) {
      throw new TypeError('config URI is not supported');
    }
    if ([ 'http:', 'https:' ].indexOf(urlObj.protocol) >= 0) {
      configJson = JSON.parse(await request.get(configPath));
      for (const key in configJson.plugins) {
        const plugin = configJson.plugins[key];
        if (path.isAbsolute(plugin.package) || plugin.package.startsWith('.')) {
          throw new TypeError(`local path is invalid for plugin package: ${plugin.package}`);
        }
      }
    } else if (urlObj.protocol === 'file:') {
      configJson = await fs.readJSON(url.fileURLToPath(configPath));
    } else {
      throw new TypeError(`protocol ${urlObj.protocol} is not supported`);
    }
    return configJson;
  } else {
    return configPath;
  }
}

export async function parseConfig(configPath: string | RunConfigI, isGenerateId = true): Promise<PipelineEntity> {
  const configJson = await loadConfig(configPath);
  const parseParams = function (params: any): string {
    return params ? JSON.stringify(params) : '{}';
  };
  return {
    id: isGenerateId ? generateId() : undefined,
    name: configJson.name,
    dataCollect: configJson.plugins.dataCollect?.package,
    dataCollectParams: parseParams(configJson.plugins.dataCollect?.params),

    dataAccess: configJson.plugins.dataAccess?.package,
    dataAccessParams: parseParams(configJson.plugins.dataAccess?.params),

    dataProcess: configJson.plugins.dataProcess?.package,
    dataProcessParams: parseParams(configJson.plugins.dataProcess?.params),

    datasetProcess: configJson.plugins.datasetProcess?.package,
    datasetProcessParams: parseParams(configJson.plugins.datasetProcess?.params),

    modelDefine: configJson.plugins.modelDefine?.package,
    modelDefineParams: parseParams(configJson.plugins.modelDefine?.params),

    modelLoad: configJson.plugins.modelLoad?.package,
    modelLoadParams: parseParams(configJson.plugins.modelLoad?.params),

    modelTrain: configJson.plugins.modelTrain?.package,
    modelTrainParams: parseParams(configJson.plugins.modelTrain?.params),

    modelEvaluate: configJson.plugins.modelEvaluate?.package,
    modelEvaluateParams: parseParams(configJson.plugins.modelEvaluate?.params)
  };
}

/**
 * copy the folder with reflink mode
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  const onDir = async (src: string, dest: string) => {
    await fs.ensureDir(dest);
    const items = await fs.readdir(src);
    // TODO(Feely): use fs-extra.copyFile to make it parallel after node-graceful-fs #202 merged,
    // otherwise, if copy too much files at same time, `EMFILE` or `ENFILE` will be thrown
    for (const item in items) {
      await copyDir(path.join(src, item), path.join(dest, item));
    }
  };

  const onFile = async (src: string, dest: string, mode: number) => {
    await copyFileAsync(src, dest, fs.constants.COPYFILE_FICLONE);
    await fs.chmod(dest, mode);
  };

  const onLink = async (src: string, dest: string) => {
    const resolvedSrc = await fs.readlink(src);
    await fs.symlink(resolvedSrc, dest);
  };

  const srcStat = await fs.lstat(src);
  if (srcStat.isDirectory()) {
    await onDir(src, dest);
  } else if (
    srcStat.isFile() ||
    srcStat.isCharacterDevice() ||
    srcStat.isBlockDevice()
  ) {
    await onFile(src, dest, srcStat.mode);
  } else if (srcStat.isSymbolicLink()) {
    await onLink(src, dest);
  }
}
