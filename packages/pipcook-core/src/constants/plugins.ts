export const DATACOLLECT = 'dataCollect';
export const DATAACCESS = 'dataAccess';
export const DATAPROCESS = 'dataProcess';
export const MODELLOAD = 'modelLoad';
export const MODELTRAIN = 'modelTrain';
export const MODELEVALUATE = 'modelEvaluate';
export const MODELDEPLOY = 'modelDeploy';

type PluginTypeI = 
  'dataCollect' | 'dataAccess' | 'dataProcess' | 'modelLoad' | 'modelTrain' | 'modelEvaluate' | 'modelDeploy';


export const PLUGINS: PluginTypeI[]= [
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  MODELLOAD,
  MODELTRAIN,
  MODELEVALUATE,
  MODELDEPLOY
];
