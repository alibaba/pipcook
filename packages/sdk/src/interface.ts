// TODO: move these defines to core or somewhere to share with daemon
export interface JobModel {
  id: string;
  pipelineId: string;
  specVersion: string;
  metadata: number;
  evaluateMap: string;
  evaluatePass: boolean;
  currentIndex: number;
  error: string;
  endTime: number;
  status: number;
  dataset: string;
}

export interface PipelineModel {
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

export interface JobRunOption {
  pipelineId: string;
  timeout?: number;
  tuna?: boolean;
}

export interface PipelineInstallOption {
  tuna: boolean;
}
