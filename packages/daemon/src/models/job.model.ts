import { model, property } from '@loopback/repository';
import { Base } from './base';
import { PluginTypeI } from '@pipcook/pipcook-core';

export interface JobParam {
  pluginType: PluginTypeI;
  data: object;
}

@model()
export class Job extends Base {
  @property({
    type: 'string',
    required: true
  })
  pipelineId: string;

  @property({
    type: 'string'
  })
  specVersion: string;

  @property({
    type: 'object'
  })
  evaluateMap?: object;

  @property({
    type: 'object'
  })
  evaluatePass?: boolean;

  @property({
    type: 'number',
    default: -1
  })
  currentIndex: number;

  @property({
    type: 'string'
  })
  error?: string;

  @property({
    type: 'date'
  })
  endTime?: number;

  @property({
    type: 'number'
  })
  status?: number;

  @property({
    type: 'string'
  })
  dataset?: string;

  @property({
    type: 'object'
  })
  params?: JobParam[];
  constructor(data?: Partial<Job>) {
    super(data);
  }
}

export interface JobRelations {
  // describe navigational properties here
}

export type JobWithRelations = Job & JobRelations;
