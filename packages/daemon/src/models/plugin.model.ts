import { model, property } from '@loopback/repository';
import { Base } from './base';
import { PluginStatus } from '@pipcook/pipcook-core';

@model()
export class Plugin extends Base {
  @property({
    type: 'string',
    required: true
  })
  name: string;

  @property({
    type: 'string',
    required: true
  })
  version: string;

  @property({
    type: 'string',
    required: true
  })
  category: string;

  @property({
    type: 'string',
    required: true
  })
  datatype: string;

  @property({
    type: 'string'
  })
  namespace: string;

  @property({
    type: 'string',
    required: true
  })
  dest: string;

  @property({
    type: 'string',
    required: true
  })
  sourceFrom: string;

  @property({
    type: 'string',
    required: true
  })
  sourceUri: string;

  @property({
    type: 'number',
    default: 0
  })
  status: PluginStatus;

  @property({
    type: 'string'
  })
  error: string;

  constructor(data?: Partial<Plugin>) {
    super(data);
  }
}
// TODO(feely): complete the relation
export interface PluginRelations {
  __ignore: number;
}
export type PluginWithRelations = Plugin & PluginRelations;
