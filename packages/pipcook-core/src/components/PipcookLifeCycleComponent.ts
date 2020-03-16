/**
 * @file The file contains Pipcook components. Component refer to the wrapper to include plugins
 * Beside plugin, it will contain all related info required to run plugin.
 */

import {PipcookLifeCycleComponent, PipcookComponentResult} from '../types/component';
import {PipcookPlugin, DataCollectType, DataAccessType, DataProcessType, ModelLoadType, 
  ModelTrainType, ModelEvaluateType, ModelDeployType} from '../types/plugins';
import {DATACOLLECT, DATAACCESS, DATAPROCESS, MODELLOAD, MODELTRAIN, MODELEVALUATE, MODELDEPLOY} from '../constants/plugins';
import {DATA, MODEL, EVALUATE, DEPLOYMENT, MODELTOSAVE, ORIGINDATA} from '../constants/other';
import { from } from 'rxjs';


/**
 * The is the factory function to produce Pipcook Component.
 * @param type: plugin type
 * @param plugin: plugin
 * @param params: plugin's parameters
 */
function produceResultFactory(type: 'dataCollect' | 'dataAccess' | 'dataProcess' | 'modelLoad' | 'modelTrain' | 'modelEvaluate' | 'modelDeploy',
  plugin: PipcookPlugin, params? : any): PipcookComponentResult {
  const result: PipcookComponentResult = {
    type, 
    plugin,
    previousComponent: null,
    status: 'not execute',
    returnType: 'not set',
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
    return from(plugin({...params, ...insertParams}));
  }
  result.returnType = ORIGINDATA;
  return result;
}

/**
 * Data-Access Plugin's Component
 * @param plugin 
 * @param params 
 */
export const DataAccess: PipcookLifeCycleComponent = (plugin: DataAccessType, params?: any) => {
  const result = produceResultFactory(DATAACCESS, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin({...params, ...insertParams}));
  };
  result.returnType = DATA;
  return result;
}

/**
 * Data-Process Plugin's Component
 * @param plugin 
 * @param params 
 */
export const DataProcess: PipcookLifeCycleComponent = (plugin: DataProcessType, params?: any) => {
  const result = produceResultFactory(DATAPROCESS, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, {...params, ...insertParams}));
  };
  result.returnType = DATA;
  return result;
}

/**
 * Model-Load Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelLoad: PipcookLifeCycleComponent = (plugin: ModelLoadType, params?: any) => {
  const result = produceResultFactory(MODELLOAD, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, {...params, ...insertParams}));
  }
  result.returnType = MODEL;
  return result;
}

/**
 * Model-Train Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelTrain: PipcookLifeCycleComponent = (plugin: ModelTrainType, params?: any) => {
  const result = produceResultFactory(MODELTRAIN, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, model, {...params, ...insertParams}));
  }
  result.returnType = MODELTOSAVE;
  return result;
}

/**
 * Model-Evaluate Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelEvaluate: PipcookLifeCycleComponent = (plugin: ModelEvaluateType, params?: any) => {
  const result = produceResultFactory(MODELEVALUATE, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, model, {...params, ...insertParams}));
  };
  result.returnType = EVALUATE;
  return result;
}

/**
 * Model-Deploy Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelDeploy: PipcookLifeCycleComponent = (plugin: ModelDeployType, params?: any) => {
  const result = produceResultFactory(MODELDEPLOY, plugin, params);
  result.observer = (data: any, model, insertParams) => {
    return from(plugin(data, model, {...params, ...insertParams}));
  };
  result.returnType = DEPLOYMENT;
  return result;
}

