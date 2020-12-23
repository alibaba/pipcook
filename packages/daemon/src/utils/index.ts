import Queue from 'queue';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { exec, ExecOptions, ExecException } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as request from 'request-promise';
import * as url from 'url';
import {
  PluginTypeI,
  RunConfigI,
  generateId
} from '@pipcook/pipcook-core';
import { Pipeline } from '../models';

export const pluginQueue = new Queue({ autostart: true, concurrency: 1 });

export async function loadConfig(configPath: string | RunConfigI): Promise<RunConfigI> {
  if (typeof configPath === 'string') {
    let configJson: RunConfigI;
    const urlObj = url.parse(configPath);
    if (urlObj.protocol === null) {
      throw new TypeError('config URI is not supported');
    }
    if ([ 'http:', 'https:' ].indexOf(urlObj.protocol as string) >= 0) {
      configJson = JSON.parse(await request.get(configPath));
      for (const key in configJson.plugins) {
        const plugin = configJson.plugins[key as PluginTypeI];
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

export async function parseConfig(configPath: string | RunConfigI, isGenerateId = true): Promise<Pipeline> {
  const configJson = await loadConfig(configPath);
  return new Pipeline({
    id: isGenerateId ? generateId() : undefined,
    name: configJson.name,
    dataCollect: configJson.plugins.dataCollect?.package,
    dataCollectParams: configJson.plugins.dataCollect?.params,

    dataAccess: configJson.plugins.dataAccess?.package,
    dataAccessParams: configJson.plugins.dataAccess?.params,

    dataProcess: configJson.plugins.dataProcess?.package,
    dataProcessParams: configJson.plugins.dataProcess?.params,

    datasetProcess: configJson.plugins.datasetProcess?.package,
    datasetProcessParams: configJson.plugins.datasetProcess?.params,

    modelDefine: configJson.plugins.modelDefine?.package,
    modelDefineParams: configJson.plugins.modelDefine?.params,

    modelTrain: configJson.plugins.modelTrain?.package,
    modelTrainParams: configJson.plugins.modelTrain?.params,

    modelEvaluate: configJson.plugins.modelEvaluate?.package,
    modelEvaluateParams: configJson.plugins.modelEvaluate?.params
  });
}

/**
 * copy the folder with reflink mode
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  const onDir = async (src: string, dest: string) => {
    await fs.ensureDir(dest);
    const items = await fs.readdir(src);
    const copyPromises = items.map(item => copyDir(path.join(src, item), path.join(dest, item)));
    return Promise.all(copyPromises);
  };

  const onFile = async (src: string, dest: string, mode: number) => {
    await fs.copyFile(src, dest, fs.constants.COPYFILE_FICLONE);
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

export function execAsync(cmd: string, opts: ExecOptions): Promise<string> {
  return new Promise((resolve, reject): void => {
    exec(cmd, opts, (err: ExecException | null, stdout: string) => {
      err == null ? resolve(stdout) : reject(err);
    });
  });
}

export const pipelinePromisify = promisify(pipeline);
