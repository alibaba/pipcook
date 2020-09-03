/**
 * pipeline update parameter
 */
export interface UpdateParameter {
  name?: string;

  dataCollectId?: string;
  dataCollectParams?: string;

  dataAccessId?: string;
  dataAccessParams?: string;

  dataProcessId?: string;
  dataProcessParams?: string;

  datasetProcessId?: string;
  datasetProcessParams?: string;

  modelDefineId?: string;
  modelDefineParams?: string;

  modelLoadId?: string;
  modelLoadParams?: string;

  modelTrainId?: string;
  modelTrainParams?: string;

  modelEvaluateId?: string;
  modelEvaluateParams?: string;
}
