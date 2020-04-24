/**
 * @file This file is for helper functions related to Pipcook-core
 */
import * as path from 'path';
import * as fs from 'fs-extra';

import { Observable, from } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { PipcookRunner } from './index';
import { PipcookComponentResult } from '../types/component';
import { logCurrentExecution } from '../utils/logger';
import {
  DATA, MODEL, EVALUATE, DEPLOYMENT, MODELTOSAVE
} from '../constants/other';

/**
 * Retreive relative logs required to be stored.
 * @param pipcookRunner : The pipcookRunner object
 */
export function getLog(pipcookRunner: PipcookRunner): any {
  const result: any = {
    ...pipcookRunner,
    latestModel: null,
    latestSampleData: null
  };

  if (pipcookRunner.latestSampleData
     && pipcookRunner.latestSampleData.metadata) {
    result.metadata = pipcookRunner.latestSampleData.metadata;
  }

  return result;
}

/**
 * According to return type of plugin, we need to update runner.
 * @param updatedType: updated return type of plugin
 * @param result: lasted return data of plugin
 */
export async function assignLatestResult(
  updatedType: string,
  result: any,
  self: PipcookRunner,
  saveModelCallback?: Function
) {
  switch (updatedType) {
  case DATA:
    self.latestSampleData = result;
    break;
  case MODEL:
    self.latestModel = result;
    break;
  case EVALUATE:
    console.log('evaluate result: ', result);
    self.latestEvaluateResult = result;
    break;
  case DEPLOYMENT:
    self.latestDeploymentResult = result;
    break;
  case MODELTOSAVE:
    self.latestModel = result;
    if (saveModelCallback) {
      const valueMap = (
        self.latestSampleData
        && self.latestSampleData.metadata
        && self.latestSampleData.metadata.label
        && self.latestSampleData.metadata.labelMap)
        || {};
      fs.writeJSONSync(path.join(process.cwd(), '.temp', self.pipelineId, 'label.json'), valueMap);
      await saveModelCallback(path.join(self.logDir as string, 'model'), self.pipelineId, path.join(process.cwd(), '.temp', self.pipelineId, 'label.json'));
    }
    break;
  default:
    break;
  }
}

/**
 * create the pipeline according to the components given. The pipelien serializes all components sepcified
 * @param components: EscherComponent
 * @param self: the pipeline subject
 */
export function createPipeline(components: PipcookComponentResult[], self: PipcookRunner, logType = 'normal', saveModelCallback?: Function) {
  const firstComponent = components[0];
  firstComponent.status = 'running';
  logCurrentExecution(firstComponent, logType);
  const insertParams = {
    pipelineId: self.pipelineId,
    modelDir: path.join(self.logDir, 'model'),
    dataDir: path.join(self.logDir, 'data')
  };
  const firstObservable = firstComponent.observer(
    null, self.latestModel, insertParams
  ) as Observable<any>;
  self.updatedType = firstComponent.returnType;

  const flatMapArray: any = [];
  self.currentIndex = 0;
  for (let i = 1; i < components.length; i++) {
    // rxjs pipe: serialize all components
    (function execute(
      component, assignLatestResult, updatedType, self, flatMapArray
    ) {
      const flatMapObject = flatMap((result) => {
        component.previousComponent.status = 'success';
        self.currentIndex++;
        logCurrentExecution(component, logType);
        return from(
          assignLatestResult(updatedType, result, self, saveModelCallback)
        ).pipe(
          flatMap(() => component.observer(
            self.latestSampleData, self.latestModel, insertParams
          ))
        );
      });
      flatMapArray.push(flatMapObject);
    }(components[i], assignLatestResult, self.updatedType, self, flatMapArray));
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
export function assignFailures(components: PipcookComponentResult[]) {
  components.forEach((component: PipcookComponentResult) => {
    if (component.status === 'running') {
      component.status = 'failure';
    }
    if (component.mergeComponents) {
      component.mergeComponents.forEach(
        (componentArray: PipcookComponentResult[]) => {
          componentArray.forEach((component: PipcookComponentResult) => {
            if (component.status === 'running') {
              component.status = 'failure';
            }
          });
        }
      );
    }
  });
}
