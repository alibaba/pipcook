import {PipcookPlugin} from './plugins';
import {PipcookModel} from './model'
import {OriginSampleData, UniformSampleData, InsertParams} from './data';
import {PipObject} from './other';
import { Subscribable } from 'rxjs';

interface ObserverFunc {
  (data: OriginSampleData | OriginSampleData[]| UniformSampleData | UniformSampleData[] | null, 
    model: PipcookModel | PipcookModel[] |null, insertParams: InsertParams): Subscribable<any>;
}

export interface PipcookComponentResult {
  type: 'dataCollect' | 'dataAccess' | 'dataProcess' | 'modelLoad' | 'modelTrain' | 'modelEvaluate' | 'modelDeploy'; 
  plugin?: PipcookPlugin;
  mergeComponents?: PipcookComponentResult[][];
  params?: PipObject;
  observer?: ObserverFunc;
  returnType: string;
  previousComponent: PipcookComponentResult | null;
  status: 'not execute' | 'running' | 'success' | 'failure';
}

export interface PipcookLifeCycleComponent {
  (plugin: PipcookPlugin, params?: PipObject): PipcookComponentResult;
}
