
/**
 * response of plugin query
 */
export interface PluginResp {
  id: string;
  name: string;
  version: string;
  category: string;
  datatype: string;
  namespace: string;
  dest: string;
}
/**
 * response of plugin install
 */
export interface PluginInstallingResp extends PluginResp {
  logId: string;
}

/**
 * response of pipline
 */
export interface PipelineResp {
  id: string;
  name: string;
  dataCollect: string;
  dataCollectParams: string;
  dataAccess: string;
  dataAccessParams: string;
  dataProcess: string;
  dataProcessParams: string;
  modelDefine: string;
  modelDefineParams: string;
  modelLoad: string;
  modelLoadParams: string;
  modelTrain: string;
  modelTrainParams: string;
  modelEvaluate: string;
  modelEvaluateParams: string;
}

/**
 * response of pipeline install
 */
export interface PipelineInstallingResp extends PipelineResp {
  logId: string;
}