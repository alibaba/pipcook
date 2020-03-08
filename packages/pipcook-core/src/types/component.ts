import {PipcookPlugin} from './plugins';
import {PipcookModel} from './model'
import {OriginSampleData, UniformSampleData, InsertParams} from './data';
import {PipObject} from './other';
import {Subscribable} from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PipcookComponent {}

interface ObserverFunc {
  (data: OriginSampleData | OriginSampleData[]| UniformSampleData | UniformSampleData[] | null, 
    model: PipcookModel | PipcookModel[] |null, insertParams: InsertParams): Subscribable<any>;
}

type ResultType = 
  'dataCollect'   | 
  'dataAccess'    | 
  'dataProcess'   | 
  'modelLoad'     | 
  'modelTrain'    |
  'modelEvaluate' |
  'modelDeploy'   ;

export interface PipcookComponentResult {
  type: ResultType;
  plugin?: PipcookPlugin;
  mergeComponents?: PipcookComponent[][];
  params?: PipObject;
  observer?: ObserverFunc;
  returnType: string;
  previousComponent: PipcookComponentResult | null;
  status: 'not execute' | 'running' | 'success' | 'failure';
}

export interface PipcookLifeCycleComponent extends PipcookComponent{
  (plugin: PipcookPlugin, params?: PipObject): PipcookComponentResult;
}

// export interface DataMergeComponent extends PipcookComponent {
//   (...mergeComponents: PipcookComponentResult[][]): PipcookComponentResult;
// }
