import {DataType} from '@tensorflow/tfjs-node-gpu';

export interface DataDescriptor {
  name: string;
  type: DataType;
  shape: number[];
  possibleValues?: string[] | number[];
  valueMap?: any;
}

export interface MetaData {
  feature: DataDescriptor;
  label: DataDescriptor;
  trainSize?: number;
  validationSize?: number;
  testSize?: number;
}

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
