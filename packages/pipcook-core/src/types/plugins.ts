
import * as tf from '@tensorflow/tfjs-node-gpu';
import {OriginSampleData, UniformSampleData} from './data';
import {PipcookModel} from './model';
import {EvaluateResult, DeploymentResult} from './other';

export interface PipcookPlugin {
}

export interface ArgsType {
  [key: string]: any;
}

export interface ModelArgsType extends ArgsType {
  train: boolean;
}

export interface ModelLoadArgsType extends ArgsType {
  modelId: string;
}

export interface DataCollectType extends PipcookPlugin {
  (args?: ArgsType): Promise<OriginSampleData>; 
}

export interface DataAccessType extends PipcookPlugin {
  (data: OriginSampleData | OriginSampleData[], args?: ArgsType): Promise<UniformSampleData>
}

export interface DataProcessType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ArgsType): Promise<UniformSampleData>
}

export interface ModelLoadType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], args?: ModelLoadArgsType): Promise<PipcookModel>
}

export interface ModelTrainType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[], args?: ArgsType): Promise<PipcookModel>
}

export interface ModelEvaluateType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[], args?: ArgsType): Promise<EvaluateResult>
}

export interface ModelDeployType extends PipcookPlugin {
  (data: UniformSampleData | UniformSampleData[], model: PipcookModel | PipcookModel[], args?: ArgsType): Promise<DeploymentResult>
}