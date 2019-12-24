/**
 * @file The file contains Pipcook components. Component refer to the wrapper to include plugins
 * Beside plugin, it will contain all related info required to run plugin.
 */

import {PipcookLifeCycleComponent} from '../types/component';
import {PipcookPlugin, DataCollectType, DataAccessType, DataProcessType, ModelLoadType, 
  ModelTrainType, ModelEvaluateType, ModelDeployType} from '../types/plugins';
import {DATACOLLECT, DATAACCESS, DATAPROCESS, MODELLOAD, MODELTRAIN, MODELEVALUATE, MODELDEPLOY} from '../constants/plugins';
import {DATA, MODEL, EVALUATE, DEPLOYMENT, MERGE, MODELTOSAVE, ORIGINDATA} from '../constants/other';
import { from } from 'rxjs';
import {OriginSampleData, UniformSampleData} from '../types/data';
import {PipcookModel} from '../types/model';


/**
 * The is the factory function to produce Pipcook Component.
 * @param type: plugin type
 * @param plugin: plugin
 * @param params: plugin's parameters
 */
function produceResultFactory(type: 'dataCollect' | 'dataAccess' | 'dataProcess' | 'modelLoad' | 'modelTrain' | 'modelEvaluate' | 'modelDeploy',
  plugin: PipcookPlugin, params? :any): any {
  const result: any = {
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
  result.observer = () => {
    return from(plugin(params));
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
  result.observer = (data: OriginSampleData[] | OriginSampleData) => {
    return from(plugin(data, params));
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
  result.observer = (data: UniformSampleData | UniformSampleData[]) => {
    return from(plugin(data, params));
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
  result.observer = (data: UniformSampleData | UniformSampleData[]) => {
    return from(plugin(data, params));
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
  result.observer = (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[]) => {
    return from(plugin(data, model, params));
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
  result.observer = (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[]) => {
    return from(plugin(data, model, params));
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
  result.observer = (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[]) => {
    return from(plugin(params));
  };
  result.returnType = DEPLOYMENT;
  return result;
}

/**
 * WARNING: This will not be open to user at current state.
 * TODO: more mature way to support 'merge data' in the pipeline
 * @param mergeComponents 
 */
// export const DataMerge: DataMergeComponent = (...mergeComponents: PipcookComponentResult[][]): PipcookComponentResult => {
//   const result: any = {
//     type: 'dataMerge', 
//     mergeComponents,
//   };
//   result.observer = (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[], pipelineId:string, logDir: string) => {
//     const mergePipelines: any[] = [];
//     const updatedTypes: string[] = [];
//     mergeComponents.forEach((components: PipcookComponentResult[]) => {
//       const self = {
//         latestSampleData: data,
//         latestOriginSampleData: data,
//         latestModel: model,
//         updatedType: '',
//         pipelineId,
//         logDir
//       }
//       const pipeline = createPipeline(components, self, 'merge');
//       mergePipelines.push(pipeline);
//       updatedTypes.push(self.updatedType)
//     });
//     let oneType = updatedTypes[0];
//     for (let i = 0; i < updatedTypes.length; i++) {
//       if (updatedTypes[i] !== oneType && !((oneType === MODEL || oneType === MODELTOSAVE) && 
//         (updatedTypes[i] !== MODEL || updatedTypes[i] !== MODELTOSAVE))) {
//           throw new Error('The output of MergeData cannot be merged, please ensure the output are of same type');
//         }
//       oneType = updatedTypes[i];
//     }

//     const finalPipeline = forkJoin(
//       ...mergePipelines
//     );
//     return finalPipeline;
//   }
//   result.returnType = mergeComponents[0][0].returnType;
//   if (result.returnType === MODEL) {
//     result.returnType = MODELTOSAVE;
//   } 
//   return result;
// }
