/**
 * @file This file is for helper functions related to Pipcook-core
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import { v1 as uuidv1 } from 'uuid';
import {
  RunConfigI,
  PipelineDB,
  PipelineDBParams,
  constants,
} from '@pipcook/pipcook-core';

const { PLUGINS, PIPCOOK_LOGS } = constants;

export async function parseConfig(configPath: string, generateId = true): Promise<PipelineDB> {
  const configJson: RunConfigI = await fs.readJson(configPath);
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
