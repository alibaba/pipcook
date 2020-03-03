/**
 * @file This file is for helper functions related to Pipcook-core
 */
import * as path from 'path';
import * as fs from 'fs-extra';

import {PipcookRunner} from './core'; 
import {PipcookComponentResult} from '../types/component';
import {ModelDeployType} from '../types/plugins';
import {logCurrentExecution} from '../utils/logger';
import {Observable, from} from 'rxjs';
import {flatMap} from 'rxjs/operators';
import {DATA, MODEL, EVALUATE, DEPLOYMENT, MODELTOSAVE, ORIGINDATA} from '../constants/other';
import {DATAACCESS} from '../constants/plugins';

/**
 * Retreive relative logs required to be stored.
 * @param pipcookRunner : The pipcookRunner object
 */
export function getLog(pipcookRunner: PipcookRunner): any {
  return {
    ...pipcookRunner,
    fastify: null,
    latestModel: null
  };
}

/**
 * According to return type of plugin, we need to update runner.
 * @param updatedType: updated return type of plugin
 * @param result: lasted return data of plugin
 */
export async function assignLatestResult(updatedType: string, result: any, self: PipcookRunner, saveModelCallback?: Function) {
  switch (updatedType) {
    case DATA:
      self.latestSampleData = result;
      break;
    case MODEL:
      self.latestModel = result;
      break;
    case EVALUATE:
      self.latestEvaluateResult = result;
      break;
    case DEPLOYMENT:
      self.latestDeploymentResult = result;
      break;
    case ORIGINDATA:
      self.latestOriginSampleData = result;
      break;
    case MODELTOSAVE:
      self.latestModel = result;
      if (Array.isArray(result) && result.length > 0) {
        result = result[0];
      }
      await result.save(path.join(self.logDir as string, 'model'));
      if (saveModelCallback) {
        const valueMap = 
        (self.latestSampleData && self.latestSampleData.metaData 
          && self.latestSampleData.metaData.label && self.latestSampleData.metaData.label.valueMap) || {};
        fs.writeJSONSync(path.join(process.cwd(), '.temp', self.pipelineId, 'label.json'), valueMap);
        await saveModelCallback(path.join(self.logDir as string, 'model'), self.pipelineId, path.join(process.cwd(), '.temp', self.pipelineId, 'label.json'));
      } 
      break;
    default:
      throw new Error('Returned Data Type is not recognized');
  }
}

/**
 * create the pipeline according to the components given. The pipelien serializes all components sepcified
 * @param components: EscherComponent 
 * @param self: the pipeline subject
 */
export function createPipeline(components: PipcookComponentResult[], self: PipcookRunner, logType='normal', saveModelCallback?: Function) {
  const firstComponent = components[0];
  firstComponent.status = 'running';
  logCurrentExecution(firstComponent, logType)
  const insertParams = {
    pipelineId: self.pipelineId
  }
  const firstObservable = firstComponent.observer(self.latestOriginSampleData, self.latestModel, insertParams) as Observable<any>;
  self.updatedType = firstComponent.returnType;

  const flatMapArray: any = [];
  self.currentIndex = 0;
  for (let i = 1; i < components.length; i++) {
    // rxjs pipe: serialize all components
    (function execute(component, assignLatestResult, updatedType, self, flatMapArray)  {
      const flatMapObject = flatMap((result) => {
        component.previousComponent.status = 'success';
        self.currentIndex++;
        logCurrentExecution(component, logType);
        return from(assignLatestResult(updatedType, result, self, saveModelCallback)).pipe(
          flatMap(() => {
            if (component.type === DATAACCESS) {
              return component.observer(self.latestOriginSampleData, self.latestModel, insertParams);
            } else {
              return component.observer(self.latestSampleData, self.latestModel, insertParams);
            }
            
          })
        )  
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
    components[i].previousComponent = components[i-1];
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
      component.mergeComponents.forEach((componentArray: PipcookComponentResult[]) => {
        componentArray.forEach((component: PipcookComponentResult) => {
          if (component.status === 'running') {
            component.status = 'failure';
          }
        })
      })
    }
  })
}

/**
 * this is to start the pipcook prediction service.
 * The function will be called after the pipeline is finished and predictServer parameter is true
 */
export async function runPredict(runner: PipcookRunner, request: any) {
  const {components, latestModel} = runner;
  const {data} = request.body;

  // we need to find out the dataAccess and dataProcess component 
  // since the prediction data needs to be processed by these two steps
  const dataAccess = components.find((e) => e.type === 'dataAccess');
  const dataProcess = components.find((e) => e.type === 'dataProcess');
  const modelDeploy = components.find((e) => e.type === 'modelDeploy');

  const result = await (modelDeploy.plugin as ModelDeployType)({}, {}, {
    data, dataAccess, model: latestModel, dataProcess
  });

  return {
    status: true,
    result: result
  }
}

