/**
 * @file The file contains Pipcook components. Component refer to the wrapper to include plugins
 * Beside plugin, it will contain all related info required to run plugin.
 */

import * as path from 'path';
import { from, range, forkJoin, Subscribable } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { PipcookLifeCycleComponent, PipcookComponentResult, PipcookLifeCycleTypes } from '../types/component';
import { DATA, MODEL, EVALUATE, MODELTOSAVE } from '../constants/other';
import {
  PipcookPlugin,
  DataCollectType,
  DataAccessType,
  DataProcessType,
  ModelLoadType,
  ModelDefineType,
  ModelTrainType,
  ModelEvaluateType
} from '../types/plugins';
import {
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  MODELLOAD,
  MODELDEFINE,
  MODELTRAIN,
  MODELEVALUATE
} from '../constants/plugins';
import { UniDataset } from '../types/data/common';

/**
 * The is the factory function to produce Pipcook Component.
 * @param type: plugin type
 * @param plugin: plugin
 * @param params: plugin's parameters
 */
function produceResultFactory(type: 'dataCollect' | 'dataAccess' | 'dataProcess' | 'modelLoad' | 'modelDefine' |'modelTrain' | 'modelEvaluate' | 'modelDeploy',
  plugin: PipcookPlugin, params? : any): PipcookComponentResult {
  const result: PipcookComponentResult = {
    type, 
    plugin,
    previousComponent: null,
    status: 'not execute',
    returnType: 'not set'
  };
  if (params) {
    result.params = params;
  }
  return result;
}

/**
 * Data-Collect Plugin's Component
 * @param plugin: plugin
 * @param params: plugin's parameters
 */
export const DataCollect: PipcookLifeCycleComponent = (plugin: DataCollectType, params?: any) => {
  const result = produceResultFactory(DATACOLLECT, plugin, params);
  result.observer = (data, model, insertParams) => {
    return from(plugin({ ...params, ...insertParams }));
  };
  return result;
};

/**
 * Data-Access Plugin's Component
 * @param plugin 
 * @param params 
 */
export const DataAccess: PipcookLifeCycleComponent = (plugin: DataAccessType, params?: any) => {
  const result = produceResultFactory(DATAACCESS, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin({ ...params, ...insertParams }));
  };
  result.returnType = DATA;
  return result;
};

/**
 * Data-Process Plugin's Component
 * @param plugin 
 * @param params 
 */
export const DataProcess: PipcookLifeCycleComponent = (plugin: DataProcessType, params?: any) => {
  const result = produceResultFactory(DATAPROCESS, plugin, params);
  result.observer = (data: UniDataset, model, insertParams) => {
    if (!data.metadata) {
      data.metadata = {};
    }
    const observerables: Subscribable<any>[] = [];
    [ data.trainLoader, data.validationLoader, data.testLoader ].forEach((loader) => {
      if (loader) {
        observerables.push(
          from(loader.len()).pipe(
            flatMap((x) => range(0, x)),
            flatMap((x) => loader.getItem(x)),
            flatMap((x) => plugin(x, data.metadata, { ...params, ...insertParams }))
          )
        );
      }
    });
    return from(forkJoin(observerables).toPromise());
  };
  return result;
};

/**
 * Model-Load Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelLoad: PipcookLifeCycleComponent = (plugin: ModelLoadType, params?: any) => {
  const result = produceResultFactory(MODELLOAD, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, { ...params, ...insertParams }));
  };
  result.returnType = MODEL;
  return result;
};

/**
 * Model-Define Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelDefine: PipcookLifeCycleComponent = (plugin: ModelDefineType, params?: any) => {
  const result = produceResultFactory(MODELDEFINE, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, { ...params, ...insertParams }));
  };
  result.returnType = MODEL;
  return result;
};

/**
 * Model-Train Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelTrain: PipcookLifeCycleComponent = (plugin: ModelTrainType, params?: any) => {
  const result = produceResultFactory(MODELTRAIN, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, model, {
      ...params, ...insertParams, 
      saveModel: async (callback: Function) => {
        await callback(path.join(process.cwd(), 'pipcook-output', insertParams.pipelineId, 'model'));
      }
    }));
  };
  result.returnType = MODELTOSAVE;
  return result;
};

/**
 * Model-Evaluate Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelEvaluate: PipcookLifeCycleComponent = (plugin: ModelEvaluateType, params?: any) => {
  const result = produceResultFactory(MODELEVALUATE, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, model, { ...params, ...insertParams }));
  };
  result.returnType = EVALUATE;
  return result;
};

export const LifeCycleTypes: PipcookLifeCycleTypes = {
  [DATACOLLECT]: DataCollect,
  [DATAACCESS]: DataAccess,
  [DATAPROCESS]: DataProcess,
  [MODELLOAD]: ModelLoad,
  [MODELDEFINE]: ModelDefine,
  [MODELTRAIN]: ModelTrain,
  [MODELEVALUATE]: ModelEvaluate
};
