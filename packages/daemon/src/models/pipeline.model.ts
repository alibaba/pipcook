import { model, property } from '@loopback/repository';
import { Base } from './base';

@model()
export class Pipeline extends Base {
  @property({
    type: 'string'
  })
  name?: string;

  @property({
    type: 'string'
  })
  dataCollectId?: string;

  @property({
    type: 'string',
    required: true
  })
  dataCollect: string;

  @property({
    type: 'object',
    default: {}
  })
  dataCollectParams?: Record<string, unknown>;

  @property({
    type: 'string'
  })
  dataAccessId?: string;

  @property({
    type: 'string',
    required: true
  })
  dataAccess: string;

  @property({
    type: 'object',
    default: {}
  })
  dataAccessParams?: Record<string, unknown>;

  @property({
    type: 'string'
  })
  dataProcessId?: string;

  @property({
    type: 'string',
  })
  dataProcess: string;

  @property({
    type: 'object',
    default: {}
  })
  dataProcessParams?: Record<string, unknown>;

  @property({
    type: 'string'
  })
  datasetProcessId?: string;

  @property({
    type: 'string'
  })
  datasetProcess?: string;

  @property({
    type: 'object',
    default: {}
  })
  datasetProcessParams?: Record<string, unknown>;

  @property({
    type: 'string'
  })
  modelDefineId?: string;

  @property({
    type: 'string'
  })
  modelDefine: string;

  @property({
    type: 'object',
    default: {}
  })
  modelDefineParams?: Record<string, unknown>;

  @property({
    type: 'string'
  })
  modelLoadId?: string;

  @property({
    type: 'string'
  })
  modelLoad?: string;

  @property({
    type: 'string'
  })
  modelLoadParams?: object;

  @property({
    type: 'string'
  })
  modelTrainId?: string;

  @property({
    type: 'string',
    required: true
  })
  modelTrain: string;

  @property({
    type: 'object',
    default: {}
  })
  modelTrainParams?: Record<string, unknown>;

  @property({
    type: 'string'
  })
  modelEvaluateId?: string;

  @property({
    type: 'string',
    required: true
  })
  modelEvaluate: string;

  @property({
    type: 'object',
    default: {}
  })
  modelEvaluateParams?: Record<string, unknown>;

  constructor(data?: Partial<Pipeline>) {
    super(data);
  }
}

// TODO(feely): complete the relation
export interface PipelineRelations {
  __ignore: number;
}
export type PipelineWithRelations = Pipeline & PipelineRelations;
