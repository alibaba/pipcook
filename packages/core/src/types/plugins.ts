
import { UniDataset, Sample, Metadata } from './data/common';
import { UniModel } from './model';
import { EvaluateResult } from './other';
import { InsertParams } from './component';

export type PluginTypeI = 'dataCollect' | 'dataAccess' | 'dataProcess' | 'modelLoad' | 'modelDefine' |'modelTrain' | 'modelEvaluate' | 'modelDeploy';

export type ArgsType = InsertParams & Record<string, any>

export interface ModelArgsType extends ArgsType {
  train: boolean;
}

export interface ModelDefineArgsType extends ArgsType {
  recoverPath: string;
}

export interface SaveModelFunction {
  (callback: Function): void;
}

export interface ModelTrainArgsType extends ArgsType {
  saveModel: SaveModelFunction;
}

export interface PipcookPlugin {
  (...args: any[]): Promise<void | UniDataset | UniModel | EvaluateResult>;
}

export interface DataCollectType extends PipcookPlugin {
  (args: ArgsType): Promise<void>; 
}

export interface DataAccessType extends PipcookPlugin {
  (args: ArgsType): Promise<UniDataset>;
}

export interface DataProcessType extends PipcookPlugin {
  (data: Sample, metadata: Metadata, args: ArgsType): Promise<void>;
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
