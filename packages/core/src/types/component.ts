import { Observable, OperatorFunction } from 'rxjs';
import { PipcookPlugin, PluginTypeI } from './plugins';
import { UniModel } from './model';
import { UniDataset } from './data/common';
import { PipObject, PromisedValueOf, EvaluateResult } from './other';
import { OutputType } from '../constants/other';

export interface InsertParams {
  pipelineId: string;
  modelDir: string;
  dataDir: string;
}

interface ObserverFunc<T extends PipcookPlugin> {
  (data: UniDataset, model: UniModel |null, insertParams: InsertParams): Observable<PromisedValueOf<ReturnType<T>>>;
}

export type PipcookComponentOutput = 
  | void
  | UniModel
  | UniDataset
  | EvaluateResult
  
export type PipcookComponentOperator = OperatorFunction<PipcookComponentOutput, PipcookComponentOutput>

export const enum PipcookComponentResultStatus {
  NotExecute = 'not execute',
  Running = 'running',
  Success = 'success',
  Failure = 'failure'
}
  
export interface PipcookComponentResult<T extends PipcookPlugin = PipcookPlugin> {
  type: PluginTypeI;
  plugin?: PipcookPlugin;
  mergeComponents?: PipcookComponentResult<T>[][];
  params?: PipObject;
  observer?: ObserverFunc<T>;
  returnType?: OutputType;
  previousComponent: PipcookComponentResult<T> | null;
  status: PipcookComponentResultStatus;
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
