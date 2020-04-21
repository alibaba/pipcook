import { RunConfigParam } from './config';

export interface Statistic {
  metricName: string;
  metricValue: number;
}

export interface DeploymentResult {
  version: string;
  deployService: string;
  serviceapi: string;
  extraData: any;
} 

export interface PipObject {
  [key: string]: any;
}

export interface EvaluateResult {
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PipcookMergeArray {}

export interface IDeployInfo {
  deployPlugin: RunConfigParam; 
  dataProcessPlugin?: RunConfigParam; 
  modelDefinePlugin: RunConfigParam;
}
