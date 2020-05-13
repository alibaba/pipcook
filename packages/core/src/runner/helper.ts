/**
 * @file This file is for helper functions related to Pipcook-core
 */
import * as path from 'path';
import * as fs from 'fs-extra';
import { from } from 'rxjs';
import { flatMap } from 'rxjs/operators';

import { PipcookRunner } from './index';
import { OutputType } from '../constants/other';
import { logCurrentExecution } from '../utils/logger';
import { PipcookComponentResult, PipcookComponentResultStatus, InsertParams, PipcookComponentOperator, PipcookComponentOutput } from '../types/component';
import { EvaluateError, EvaluateResult, PipObject } from '../types/other';
import { UniDataset } from '../types/data/common';
import { UniModel } from '../types/model';

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
 * @param saveModelCallback
 */
export async function assignLatestResult(updatedType: OutputType, result: PipcookComponentOutput, self: PipcookRunner, saveModelCallback?: Function) {
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
export function createPipeline(components: PipcookComponentResult[], self: PipcookRunner, logType = 'normal', saveModelCallback?: Function) {
  const firstComponent = components[0];
  firstComponent.status = PipcookComponentResultStatus.Running;
  logCurrentExecution(firstComponent, logType);
  const insertParams = {
    runId: self.runId,
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
        return from(assignLatestResult(updatedType, result, self, saveModelCallback)).pipe(
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
