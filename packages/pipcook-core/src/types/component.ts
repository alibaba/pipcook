import {PipcookPlugin} from './plugins';
import {PipcookModel} from './model'
import {UniDataset} from './data/data';
import {PipObject} from './other';
import {Subscribable} from 'rxjs';


export interface InsertParams {
  pipelineId: string;
  modelDir: string;
  dataDir: string;
}

interface ObserverFunc {
  (data: UniDataset, model: PipcookModel |null, insertParams: InsertParams): Subscribable<any>;
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
