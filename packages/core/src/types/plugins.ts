
import { UniDataset } from './data/common';
import { UniModel } from './model';
import { EvaluateResult } from './other';

export interface ArgsType {
  pipelineId: string;
  modelDir: string;
  dataDir: string;
  [key: string]: any;
}

export interface ModelArgsType extends ArgsType {
  train: boolean;
}

export interface ModelDefineArgsType extends ArgsType {
  modelId: string;
  modelPath: string;
}

export interface SaveModelFunction {
  (callback: Function): void;
}

export interface ModelTrainArgsType extends ArgsType {
  saveModel: SaveModelFunction;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PipcookPlugin {
}

export interface DataCollectType extends PipcookPlugin {
  (args: ArgsType): Promise<void>; 
}

export interface DataAccessType extends PipcookPlugin {
  (args: ArgsType): Promise<UniDataset>;
}

export interface DataProcessType extends PipcookPlugin {
  (data: UniDataset, args: ArgsType): Promise<UniDataset>;
}

export interface ModelLoadType extends PipcookPlugin {
  (data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>;
}

export interface ModelDefineType extends PipcookPlugin {
  (data: UniDataset, args: ModelDefineArgsType): Promise<UniModel>;
}

export interface ModelTrainType extends PipcookPlugin {
  (data: UniDataset, model: UniModel, args: ModelTrainArgsType): Promise<UniModel>;
}

export interface ModelEvaluateType extends PipcookPlugin {
  (data: UniDataset, model: UniModel, args: ArgsType): Promise<EvaluateResult>;
}

export interface ModelDeployType extends PipcookPlugin {
  (data: UniDataset, model: UniModel, args: ArgsType): Promise<any>;
}
