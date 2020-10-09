/**
 * @file This file is for helper functions related to Pipcook-core
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import * as request from 'request-promise';
import * as url from 'url';
import {
  RunConfigI,
  generateId
} from '@pipcook/pipcook-core';
import { PipelineEntity } from '../model/pipeline';

async function loadConfig(configPath: string | RunConfigI): Promise<RunConfigI> {
  if (typeof configPath === 'string') {
    let configJson: RunConfigI;
    const urlObj = url.parse(configPath);
    if (urlObj.protocol === null) {
      throw new TypeError('config URI is not supported');
    }
    if ([ 'http:', 'https:' ].indexOf(urlObj.protocol) >= 0) {
      configJson = JSON.parse(await request(configPath));
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
