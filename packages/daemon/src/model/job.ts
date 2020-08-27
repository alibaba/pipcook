import { STRING, INTEGER, BOOLEAN, Model, Sequelize } from 'sequelize';

export class JobModel extends Model {
  id: string;
  pipelineId: string;
  specVersion: string;
  metadata: number;

  evaluateMap: string;
  evaluatePass: boolean;
  currentIndex: number;
  error: string;
  endTime: number;
  status: number;
  dataset: string;
}

export default async function model(sequelize: Sequelize): Promise<void> {
  JobModel.init({
    id: {
      type: STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    pipelineId: {
      type: STRING,
      references: {
        model: 'pipelines',
        key: 'id'
      }
    },
    specVersion: {
      type: STRING,
      field: 'spec_version',
      allowNull: false
    },
    status: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    metadata: {
      type: STRING
    },
    evaluateMap: {
      type: STRING
    },
    evaluatePass: {
      type: BOOLEAN
    },
    currentIndex: {
      type: INTEGER,
      allowNull: false,
      defaultValue: -1
    },
    dataset: {
      type: STRING
    },
    error: {
      type: STRING
    },
    endTime: {
      type: INTEGER
    }
  },
  {
    sequelize,
    modelName: 'job'
  });
  await JobModel.sync();
}
