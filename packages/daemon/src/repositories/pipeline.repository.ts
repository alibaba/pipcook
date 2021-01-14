import { DefaultCrudRepository } from '@loopback/repository';
import { Pipeline, PipelineRelations } from '../models';
import { PipcookDataSource } from '../datasources';
import { inject } from '@loopback/core';

export class PipelineRepository extends DefaultCrudRepository<
  Pipeline,
  typeof Pipeline.prototype.id,
  PipelineRelations
> {
  constructor(
    @inject('datasources.pipcook') dataSource: PipcookDataSource,
  ) {
    super(Pipeline, dataSource);
  }
}
