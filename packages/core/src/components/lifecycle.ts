/**
 * @file The file contains Pipcook components. Component refer to the wrapper to include plugins
 * Beside plugin, it will contain all related info required to run plugin.
 */

import * as path from 'path';
import { from, range, forkJoin, Observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { PipcookLifeCycleComponent, PipcookComponentResult, PipcookLifeCycleTypes, PipcookComponentResultStatus } from '../types/component';
import { OutputType } from '../constants/other';
import {
  PipcookPlugin,
  DataCollectType,
  DataAccessType,
  DataProcessType,
  ModelLoadType,
  ModelDefineType,
  ModelTrainType,
  ModelEvaluateType,
  PluginTypeI
} from '../types/plugins';
import { PipObject } from '../types/other';
import {
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  MODELLOAD,
  MODELDEFINE,
  MODELTRAIN,
  MODELEVALUATE
} from '../constants/plugins';

/**
 * The is the factory function to produce Pipcook Component.
 * @param type: plugin type
 * @param plugin: plugin
 * @param params: plugin's parameters
 */
function produceResultFactory<T extends PipcookPlugin>(type: PluginTypeI, plugin: T, params?: PipObject): PipcookComponentResult<T> {
  const result: PipcookComponentResult<T> = {
    type, 
    plugin,
    previousComponent: null,
    status: PipcookComponentResultStatus.NotExecute,
    returnType: OutputType.NotSet
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
export const DataCollect: PipcookLifeCycleComponent<DataCollectType> = (plugin, params?) => {
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
export const DataAccess: PipcookLifeCycleComponent<DataAccessType> = (plugin, params?) => {
  const result = produceResultFactory(DATAACCESS, plugin, params);
  result.observer = (data, model, insertParams) => {
    return from(plugin({ ...params, ...insertParams }));
  };
  result.returnType = OutputType.Data;
  return result;
};

/**
 * Data-Process Plugin's Component
 * @param plugin 
 * @param params 
 */
export const DataProcess: PipcookLifeCycleComponent<DataProcessType> = (plugin, params?) => {
  const result = produceResultFactory(DATAPROCESS, plugin, params);
  result.observer = (data, model, insertParams) => {
    if (!data.metadata) {
      data.metadata = {};
    }
    const observerables: Observable<void>[] = [];
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
export const ModelLoad: PipcookLifeCycleComponent<ModelLoadType> = (plugin, params?) => {
  const result = produceResultFactory(MODELLOAD, plugin, params);
  result.observer = (data, model, insertParams) => {
    return from(plugin(data, { ...params, ...insertParams }));
  };
  result.returnType = OutputType.Model;
  return result;
};

/**
 * Model-Define Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelDefine: PipcookLifeCycleComponent<ModelDefineType> = (plugin, params?) => {
  const result = produceResultFactory(MODELDEFINE, plugin, params);
  result.observer = (data, model, insertParams) => {
    return from(plugin(data, { ...params, ...insertParams }));
  };
  result.returnType = OutputType.Model;
  return result;
};

/**
 * Model-Train Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelTrain: PipcookLifeCycleComponent<ModelTrainType> = (plugin, params?) => {
  const result = produceResultFactory(MODELTRAIN, plugin, params);
  result.observer = (data, model, insertParams) => {
    return from(plugin(data, model, {
      ...params, ...insertParams, 
      saveModel: async (callback: Function) => {
        await callback(path.join(process.cwd(), 'pipcook-output', insertParams.pipelineId, 'model'));
      }
    }));
  };
  result.returnType = OutputType.ModelToSave;
  return result;
};

/**
 * Model-Evaluate Plugin Component
 * @param plugin 
 * @param params 
 */
export const ModelEvaluate: PipcookLifeCycleComponent<ModelEvaluateType> = (plugin, params?) => {
  const result = produceResultFactory(MODELEVALUATE, plugin, params);
  result.observer = (data, model, insertParams) => {
    return from(plugin(data, model, { ...params, ...insertParams }));
  };
  result.returnType = OutputType.Evaluate;
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
