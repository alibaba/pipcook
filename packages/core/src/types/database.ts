export enum PipelineStatus {
  INIT,
  RUNNING,
  SUCCESS,
  FAIL
}

export type PipelineDBParams = 'dataCollectParams' | 'dataAccessParams' | 'dataProcessParams' |
  'modelDefineParams' | 'modelLoadParams' | 'modelTrainParams' | 'modelEvaluateParams';

export interface PipelineDB {
  id?: string;
  dataCollect?: string;
  dataCollectParams?: string;
  dataAccess?: string;
  dataAccessParams?: string;
  dataProcess?: string;
  dataProcessParams?: string;
  modelDefine?: string;
  modelDefineParams?: string;
  modelLoad?: string;
  modelLoadParams?: string;
  modelTrain?: string;
  modelTrainParams?: string;
  modelEvaluate?: string;
  modelEvaluateParams?: string;
}

export interface RunDB {
  id: string;
  pipelineId: string;
  coreVersion: string;
  status: PipelineStatus;
  evaluateMap?: string;
  evaluatePass?: boolean;
  currentIndex: number;
  error?: string;
  endTime?: number;
}
