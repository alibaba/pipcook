import { STRING, INTEGER, Model, Sequelize } from 'sequelize';

export class PluginModel extends Model {
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
  error: string;
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
