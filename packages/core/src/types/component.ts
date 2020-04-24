import { Subscribable } from 'rxjs';
import { PipcookPlugin } from './plugins';
import { UniModel } from './model';
import { UniDataset } from './data/common';
import { PipObject } from './other';

export interface InsertParams {
  pipelineId: string;
  modelDir: string;
  dataDir: string;
}

interface ObserverFunc {
(
  data: UniDataset,
  model: UniModel |null,
  insertParams: InsertParams
): Subscribable<any>;
}

type ResultType =
  'dataCollect' |
  'dataAccess' |
  'dataProcess' |
  'modelLoad' |
  'modelDefine' |
  'modelTrain' |
  'modelEvaluate' |
  'modelDeploy' ;

export interface PipcookComponentResult {
  type: ResultType;
  plugin?: PipcookPlugin;
  mergeComponents?: PipcookComponentResult[][];
  params?: PipObject;
  observer?: ObserverFunc;
  returnType: string;
  previousComponent: PipcookComponentResult | null;
  status: 'not execute' | 'running' | 'success' | 'failure';
  package?: string;
  version?: string;
}

export interface PipcookLifeCycleComponent {
  (plugin: PipcookPlugin, params?: PipObject): PipcookComponentResult;
}
