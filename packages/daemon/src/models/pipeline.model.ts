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
  dataCollectParams?: object;

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
  dataAccessParams?: object;

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
  dataProcessParams?: object;

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
  datasetProcessParams?: object;

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
  modelDefineParams?: object;

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
    default: {},
  })
  modelTrainParams?: object;

  @property({
    type: 'string'
  })
  modelEvaluateId?: string;

  @property({
    type: 'string',
    required: true,
  })
  modelEvaluate: string;

  @property({
    type: 'object',
    default: {},
  })
  modelEvaluateParams?: object;

  constructor(data?: Partial<Pipeline>) {
    super(data);
  }
}

export interface PipelineRelations {
  // describe navigational properties here
}

export type PipelineWithRelations = Pipeline & PipelineRelations;
