
import { UniDataset } from './data/data';
import { PipcookModel } from './model';
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

export interface ModelLoadArgsType extends ArgsType {
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
  (data: UniDataset, args: ModelLoadArgsType): Promise<PipcookModel>;
}

export interface ModelTrainType extends PipcookPlugin {
  (data: UniDataset, model: PipcookModel, args: ModelTrainArgsType): Promise<PipcookModel>;
}

export interface ModelEvaluateType extends PipcookPlugin {
  (data: UniDataset, model: PipcookModel, args: ArgsType): Promise<EvaluateResult>;
}

export interface ModelDeployType extends PipcookPlugin {
  (data: UniDataset, model: PipcookModel, args: ArgsType): Promise<any>;
}
