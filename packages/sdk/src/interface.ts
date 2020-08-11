// TODO: move these defines to core or somewhere to share with daemon

/**
 * response of event trace
 */
export type TraceResp<T> = T & { traceId: string }

export interface JobResp {
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

export interface JobRunOption {
  pipelineId: string;
  timeout?: number;
  pyIndex?: string;
}

export interface PipelineInstallOption {
  pyIndex: string;
}

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
  status: number;
  error: string;
}

export interface EventCallback {
  (event: string, data: any): void;
}

/**
 * log event interface
 */
export interface LogEvent {
  // log level
  level: string;
  // log content
  data: string;
}
export interface PluginListParams {
  datatype?: string;
  category?: string;
  name?: string;
}
