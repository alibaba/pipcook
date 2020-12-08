import { DefaultCrudRepository } from '@loopback/repository';
import { Plugin, PluginRelations } from '../models';
import { PipcookDataSource } from '../datasources';
import { inject } from '@loopback/core';

export class PluginRepository extends DefaultCrudRepository<
  Plugin,
  typeof Plugin.prototype.id,
  PluginRelations
  > {
  constructor(
    @inject('datasources.pipcook') dataSource: PipcookDataSource,
  ) {
    super(Plugin, dataSource);
  }
}
