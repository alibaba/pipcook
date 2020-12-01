import { STRING, INTEGER, Model, Sequelize } from 'sequelize';
import { PluginStatus, generateId } from '@pipcook/pipcook-core';

export interface PluginEntity {
  id: string;
  name: string;
  version: string;
  category: string;
  datatype: string;
  namespace: string;
  dest: string;
  sourceFrom: string;
  sourceUri: string;
  status: number;
  error?: string;
}

export interface CreationParameter {
  name: string;
  version: string;
  category: string;
  datatype: string;
  dest: string;
  sourceFrom: string;
  sourceUri: string;
  status: number;
  error?: string;
  namespace?: string;
}

export interface QueryPluginsFilter {
  datatype?: string;
  category?: string;
  name?: string;
}

export class PluginModel extends Model {
  static async query(filter?: QueryPluginsFilter): Promise<PluginEntity[]> {
    const where = {} as any;
    if (filter?.category) {
      where.category = filter.category;
    }
    if (filter?.datatype) {
      where.datatype = filter.datatype;
    }
    if (filter?.name) {
      where.name = filter.name;
    }
    return (await PluginModel.findAll({ where })).map(plugin => plugin.toJSON() as PluginEntity);
  }

  static async findById(id: string): Promise<PluginEntity> {
    return (await PluginModel.findOne({ where: { id } }))?.toJSON() as PluginEntity;
  }

  static async findByIds(ids: string[]): Promise<PluginEntity[]> {
    return (await PluginModel.findAll({ where: { id: ids } })).map(plugin => plugin.toJSON() as PluginEntity);
  }
  static async findByName(name: string): Promise<PluginEntity> {
    return (await PluginModel.findOne({ where: { name } }))?.toJSON() as PluginEntity;
  }

  static async removeById(id: string): Promise<number> {
    return PluginModel.destroy({ where: { id } });
  }

  static async setStatusById(id: string, status: PluginStatus, errMsg?: string): Promise<number> {
    const [ count ] = await PluginModel.update({
      status,
      error: errMsg
    }, {
      where: { id }
    });
    return count;
  }

  static async findOrCreateByParams(creationParameter: CreationParameter): Promise<PluginEntity> {
    const [ plugin ] = await PluginModel.findOrCreate({
      where: {
        // TODO(feely): support the different versions of plugins
        name: creationParameter.name
      },
      defaults: {
        ...creationParameter,
        id: generateId()
      }
    });
    return plugin?.toJSON() as PluginEntity;
  }
}

export default async function model(sequelize: Sequelize): Promise<void> {
  PluginModel.init({
    id: {
      type: STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    name: STRING,
    version: STRING,
    category: STRING,
    datatype: STRING,
    namespace: STRING,
    dest: STRING,
    sourceFrom: STRING,
    sourceUri: STRING,
    status: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    error: STRING
  },
  {
    sequelize,
    modelName: 'plugin'
  });
  await PluginModel.sync();
}
