import { PluginTypeI } from './plugins';

export enum PipelineStatus {
  INIT,
  RUNNING,
  SUCCESS,
  FAIL
}

export type PipelineDBParams = 'dataCollectParams' | 'dataAccessParams' | 'dataProcessParams' |
  'modelDefineParams' | 'modelLoadParams' | 'modelTrainParams' | 'modelEvaluateParams';

export type PipelineDB = Partial<Record<'id' | PluginTypeI | PipelineDBParams, string>>

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
