import { Observable, OperatorFunction } from 'rxjs';
import { PipcookPlugin } from './plugins';
import { UniModel } from './model';
import { UniDataset } from './data/common';
import { PipObject, PromisedValueOf, EvaluateResult } from './other';

export interface InsertParams {
  pipelineId: string;
  modelDir: string;
  dataDir: string;
}

interface ObserverFunc<T extends PipcookPlugin> {
  (data: UniDataset, model: UniModel |null, insertParams: InsertParams): Observable<PromisedValueOf<ReturnType<T>>>;
}

type ResultType = 
  | 'dataCollect'
  | 'dataAccess'
  | 'dataProcess'
  | 'modelLoad'
  | 'modelDefine'
  | 'modelTrain'
  | 'modelEvaluate'
  
export type PipcookComponentOutput = 
  | void
  | UniModel
  | UniDataset
  | EvaluateResult
  
export type PipcookComponentOperator = OperatorFunction<PipcookComponentOutput, PipcookComponentOutput>
  
export interface PipcookComponentResult<T extends PipcookPlugin = PipcookPlugin> {
  type: ResultType;
  plugin?: PipcookPlugin;
  mergeComponents?: PipcookComponentResult<T>[][];
  params?: PipObject;
  observer?: ObserverFunc<T>;
  returnType?: string;
  previousComponent: PipcookComponentResult<T> | null;
  status: 'not execute' | 'running' | 'success' | 'failure';
  package?: string;
  version?: string;
}

export interface PipcookLifeCycleComponent<T extends PipcookPlugin> {
  (plugin: T, params?: PipObject): PipcookComponentResult<T>;
}

export interface PipcookModelDeployResult {
  execute: Function;
}

export type PipcookLifeCycleTypes = Record<string, PipcookLifeCycleComponent<PipcookPlugin>>;
