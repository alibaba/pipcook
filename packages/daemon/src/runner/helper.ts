/**
 * @file This file is for helper functions related to Pipcook-core
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import { v1 as uuidv1 } from 'uuid';
import * as request from 'request-promise';
import * as url from 'url';
import {
  RunConfigI,
  PipelineDB,
  PipelineDBParams,
  constants,
} from '@pipcook/pipcook-core';

const { PLUGINS, PIPCOOK_LOGS } = constants;

async function loadConfig(configPath: string | RunConfigI) {
  if (typeof configPath === 'string') {
    let configJson: RunConfigI;
    const urlObj = url.parse(configPath);
    if (urlObj.protocol === null) {
      throw new TypeError('config URI is not supported');
    }
    if ([ 'http:', 'https:' ].indexOf(urlObj.protocol) >= 0) {
      configJson = JSON.parse(await request(configPath));
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

export async function parseConfig(configPath: string | RunConfigI, generateId = true): Promise<PipelineDB> {
  const configJson = await loadConfig(configPath);
  const result: PipelineDB = {};

  if (generateId) {
    result.id = uuidv1();
  }
  if (configJson.name) {
    result.name = configJson.name;
  }

  PLUGINS.forEach((pluginType) => {
    if (configJson.plugins[pluginType]?.package) {
      const pluginName = configJson.plugins[pluginType].package;
      const params = configJson.plugins[pluginType].params || {};

      result[pluginType] = pluginName;
      const paramsAttribute: PipelineDBParams = (pluginType + 'Params') as PipelineDBParams;
      result[paramsAttribute] = JSON.stringify(params);
    }
  });
  return result;
}

export async function writeOutput(jobId: string, content: string, stderr = false): Promise<void> {
  const filename = stderr ? 'stderr' : 'stdout';
  const dest = path.join(PIPCOOK_LOGS, jobId, filename);
  await fs.appendFile(dest, content);
}
