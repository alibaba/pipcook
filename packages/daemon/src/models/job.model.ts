import { model, property } from '@loopback/repository';
import { Base } from './base';
import { PluginTypeI, EvaluateResult } from '@pipcook/pipcook-core';

export interface JobParam {
  pluginType: PluginTypeI;
  data: Record<string, unknown>;
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
  evaluateMap?: EvaluateResult;

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

  @property.array(Object)
  params?: JobParam[];

  constructor(data?: Partial<Job>) {
    super(data);
  }
}

// TODO(feely): complete the relation
export interface JobRelations {
  __ignore: number;
}
export type JobWithRelations = Job & JobRelations;
