export const DATACOLLECT = 'dataCollect';
export const DATAACCESS = 'dataAccess';
export const DATAPROCESS = 'dataProcess';
export const MODELLOAD = 'modelLoad';
export const MODELDEFINE = 'modelDefine';
export const MODELTRAIN = 'modelTrain';
export const MODELEVALUATE = 'modelEvaluate';
export const MODELDEPLOY = 'modelDeploy';

type PluginTypeI = 
  'dataCollect' | 'dataAccess' | 'dataProcess' | 'modelLoad' | 'modelDefine' |'modelTrain' | 'modelEvaluate' | 'modelDeploy';


export const PLUGINS: PluginTypeI[] = [
  DATACOLLECT,
  DATAACCESS,
  DATAPROCESS,
  MODELLOAD,
  MODELDEFINE,
  MODELTRAIN,
  MODELEVALUATE,
  MODELDEPLOY
];
