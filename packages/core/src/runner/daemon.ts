import * as fs from 'fs-extra';
import * as uuid from 'uuid';
import * as path from 'path';

import { RunConfigI } from '../types/config';
import { PipelineDB, PipelineDBParams, PipelineStatus, RunDB } from '../types/database';
import { PLUGINS } from '../constants/plugins';
import { PIPCOOK_LOGS } from '../constants/other';
import { LifeCycleTypes } from '../components/lifecycle';

export async function parseConfig(configPath: string, generateId = true) {
  const configJson: RunConfigI = await fs.readJson(configPath);
  const result: PipelineDB = {};
  if (generateId) {
    result.id = uuid.v1();
  }

  PLUGINS.forEach((pluginType) => {
    if (configJson.plugins[pluginType] &&
      configJson.plugins[pluginType].package &&
        LifeCycleTypes[pluginType]) {
      const pluginName = configJson.plugins[pluginType].package;
      const params = configJson.plugins[pluginType].params || {};

      result[pluginType] = pluginName;
      const paramsAttribute: PipelineDBParams = (pluginType + 'Params') as PipelineDBParams;
      result[paramsAttribute] = JSON.stringify(params);
    }
  });

  return result;
}

export async function createRun(pipelineId: string): Promise<RunDB> {
  const packageJson = await fs.readJSON(path.join(__dirname, '..', '..', 'package.json'));
  return {
    id: uuid.v1(),
    pipelineId,
    coreVersion: packageJson.version,
    status: PipelineStatus.INIT,
    currentIndex: -1
  };
}

export async function writeOutput(jobId: string, content: string, stderr = false) {
  const fileName = stderr ? 'stderr' : 'stdout';
  const filePath = path.join(PIPCOOK_LOGS, jobId, fileName);
  await new Promise((resolve, reject) => {
    fs.appendFile(filePath, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function getLog(jobId: string) {
  const log = await fs.readFile(path.join(PIPCOOK_LOGS, jobId, 'stdout'), 'utf8');
  return log;
}
