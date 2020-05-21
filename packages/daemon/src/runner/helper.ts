/**
 * @file This file is for helper functions related to Pipcook-core
 */
import * as path from 'path';
import { from } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import * as fs from 'fs-extra';
import { v1 as uuidv1 } from 'uuid';

import {
  RunConfigI,
  PipelineDB,
  PipelineDBParams,
  PipelineStatus,
  RunDB,
  constants,
  OutputType,
  PipcookComponentResult,
  PipcookComponentResultStatus,
  PipcookComponentOperator,
  PipcookComponentOutput,
  EvaluateError,
  EvaluateResult,
  PipObject,
  UniDataset,
  UniModel
} from '@pipcook/pipcook-core';

import { PIPCOOK_LOGS } from '@pipcook/pipcook-utils';

import { LifeCycleTypes } from './lifecycle';
import { PipcookRunner } from './index';
import { logCurrentExecution } from './logger';

const { PLUGINS } = constants;

/**
 * Retreive relative logs required to be stored.
 * @param pipcookRunner : The pipcookRunner object
 */
export function getLog(pipcookRunner: PipcookRunner) {
  const result: PipObject = {
    ...pipcookRunner,
    latestModel: null,
    latestSampleData: null
  };

  if (pipcookRunner.latestSampleData && pipcookRunner.latestSampleData.metadata) {
    result.metadata = pipcookRunner.latestSampleData.metadata;
  }

  return result;
}

/**
 * According to return type of plugin, we need to update runner.
 * @param updatedType: updated return type of plugin
 * @param result: lasted return data of plugin
 * @param self: the target update runner
 */
export async function assignLatestResult(updatedType: OutputType, result: PipcookComponentOutput, self: PipcookRunner) {
  switch (updatedType) {
  case OutputType.Data:
    self.latestSampleData = result as UniDataset;
    break;
  case OutputType.Model:
    self.latestModel = result as UniModel;
    break;
  case OutputType.Evaluate:
    console.log('evaluate result: ', result);
    self.evaluateMap = result as EvaluateResult;
    if (self.evaluateMap.pass === true || self.evaluateMap.pass === false) {
      self.evaluatePass = self.evaluateMap.pass;
    }
    if (self.evaluateMap.pass === false) {
      throw new EvaluateError(self.evaluateMap);
    }
    break;
  case OutputType.ModelToSave:
    self.latestModel = result as UniModel;
    break;
  default:
    break;
  }
  self.notifyStatus();
}

/**
 * create the pipeline according to the components given. The pipelien serializes all components sepcified
 * @param components: EscherComponent
 * @param self: the pipeline subject
 */
export function createPipeline(components: PipcookComponentResult[], self: PipcookRunner, logType = 'normal') {
  const firstComponent = components[0];
  firstComponent.status = PipcookComponentResultStatus.Running;
  logCurrentExecution(firstComponent, logType);
  const insertParams = {
    jobId: self.jobId,
    modelDir: path.join(self.logDir, 'model'),
    dataDir: path.join(self.logDir, 'data')
  };
  const firstObservable = firstComponent.observer(null, self.latestModel, insertParams);
  self.updatedType = firstComponent.returnType;

  const flatMapArray: PipcookComponentOperator[] = [];
  self.currentIndex = 0;
  for (let i = 1; i < components.length; i++) {
    // rxjs pipe: serialize all components
    (function execute(component, assignLatestResult, updatedType, self, flatMapArray) {
      const flatMapObject = flatMap((result: PipcookComponentOutput) => {
        component.previousComponent.status = PipcookComponentResultStatus.Success;
        self.currentIndex++;
        logCurrentExecution(component, logType);
        return from(assignLatestResult(updatedType, result, self)).pipe(
          flatMap(() => component.observer(self.latestSampleData, self.latestModel, insertParams))
        );
      });
      flatMapArray.push(flatMapObject);
    })(components[i], assignLatestResult, self.updatedType, self, flatMapArray);
    self.updatedType = components[i].returnType;
  }

  return firstObservable.pipe(
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    ...flatMapArray
  );
}

/**
 * After the user specifiy the components used for current pipeline,
 * we link each component to its previous component
 * @param components : PipcookComponentResult[]
 */
export function linkComponents(components: PipcookComponentResult[]) {
  for (let i = 1; i < components.length; i++) {
    components[i].previousComponent = components[i - 1];
  }
}

/**
 * After the pipeline is finished,
 * those components which are not changed to success status should be failing ones
 * @param components
 */
export function markFailures(components: PipcookComponentResult[]): PipcookComponentResult[] {
  return components.map(function markFailure(component) {
    const nextComponent = { ...component };

    if (nextComponent.status === PipcookComponentResultStatus.Running) {
      nextComponent.status = PipcookComponentResultStatus.Failure;
    }

    if (nextComponent.mergeComponents) {
      nextComponent.mergeComponents = nextComponent.mergeComponents
        .map((componentArray) => componentArray.map(markFailure));
    }

    return nextComponent;
  });
}

export async function parseConfig(configPath: string, generateId = true) {
  const configJson: RunConfigI = await fs.readJson(configPath);
  const result: PipelineDB = {};
  if (generateId) {
    result.id = uuidv1();
  }

  if (configJson.name) {
    result.name = configJson.name;
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
    id: uuidv1(),
    pipelineId,
    coreVersion: packageJson.version,
    status: PipelineStatus.INIT,
    currentIndex: -1
  };
}

export async function writeOutput(jobId: string, content: string, stderr = false) {
  const fileName = stderr ? 'stderr' : 'stdout';
  const filePath = path.join(PIPCOOK_LOGS, jobId, fileName);
  await fs.appendFile(filePath, content);
}

export async function retriveLog(jobId: string) {
  const log = await fs.readFile(path.join(PIPCOOK_LOGS, jobId, 'stdout'), 'utf8');
  return log;
}
