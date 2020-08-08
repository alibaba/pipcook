import { STRING, INTEGER, Model, BuildOptions } from 'sequelize';
import { providerWrapper, IApplicationContext } from 'midway';
import DB from '../boot/database';

providerWrapper([
  {
    id: 'pluginModel',
    provider: model
  }
]);

export class PluginModel extends Model {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: string;
  readonly datatype: string;
  readonly namespace: string;
  readonly dest: string;
  readonly status: number;
  readonly error: string;
}

export type PluginModelStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): PluginModel;
};

export default async function model(context: IApplicationContext): Promise<PluginModelStatic> {
  const db = await context.getAsync('pipcookDB') as DB;
  const PluginModel = db.sequelize.define('plugin', {
    id: {
      type: STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    name: {
      type: STRING
    },
    version: {
      type: STRING
    },
    category: {
      type: STRING
    },
    datatype: {
      type: STRING
    },
    namespace: {
      type: STRING
    },
    dest: {
      type: STRING
    },
    status: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    error: {
      type: STRING
    }
  }) as PluginModelStatic;
  await PluginModel.sync();
  return PluginModel;
}
