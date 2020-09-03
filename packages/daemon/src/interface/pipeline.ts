
export interface CreateParameter {
  id?: string;
  name?: string;

  dataCollectId?: string;
  dataCollect: string;
  dataCollectParams: string;

  dataAccessId?: string;
  dataAccess: string;
  dataAccessParams: string;

  dataProcessId?: string;
  dataProcess?: string;
  dataProcessParams: string;

  datasetProcessId?: string;
  datasetProcess?: string;
  datasetProcessParams: string;

  modelDefineId?: string;
  modelDefine?: string;
  modelDefineParams: string;

  modelLoadId?: string;
  modelLoad?: string;
  modelLoadParams: string;

  modelTrainId?: string;
  modelTrain: string;
  modelTrainParams: string;

  modelEvaluateId?: string;
  modelEvaluate: string;
  modelEvaluateParams: string;
}
