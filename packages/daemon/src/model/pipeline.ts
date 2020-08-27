import { STRING, Model, Sequelize } from 'sequelize';
import { JobModel } from './job';

export class PipelineModel extends Model {
  id: string;
  name: string;

  dataCollectId?: string;
  dataCollect: string;
  dataCollectParams: string;

  dataAccessId?: string;
  dataAccess: string;
  dataAccessParams: string;

  dataProcessId?: string;
  dataProcess: string;
  dataProcessParams: string;

  datasetProcessId?: string;
  datasetProcess: string;
  datasetProcessParams: string;

  modelDefineId?: string;
  modelDefine: string;
  modelDefineParams: string;

  modelLoadId?: string;
  modelLoad: string;
  modelLoadParams: string;

  modelTrainId?: string;
  modelTrain: string;
  modelTrainParams: string;

  modelEvaluateId?: string;
  modelEvaluate: string;
  modelEvaluateParams: string;
}

export default async function model(sequelize: Sequelize): Promise<void> {
  PipelineModel.init({
    id: {
      type: STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    name: {
      type: STRING,
      unique: true
    },
    dataCollectId: {
      type: STRING,
      allowNull: true
    },
    dataCollect: {
      type: STRING
    },
    dataCollectParams: {
      type: STRING
    },
    dataAccessId: {
      type: STRING
    },
    dataAccess: {
      type: STRING
    },
    dataAccessParams: {
      type: STRING
    },
    dataProcessId: {
      type: STRING,
      allowNull: true
    },
    dataProcess: {
      type: STRING
    },
    dataProcessParams: {
      type: STRING
    },
    datasetProcessId: {
      type: STRING,
      allowNull: true
    },
    datasetProcess: {
      type: STRING
    },
    datasetProcessParams: {
      type: STRING
    },
    modelDefineId: {
      type: STRING,
      allowNull: true
    },
    modelDefine: {
      type: STRING
    },
    modelDefineParams: {
      type: STRING
    },
    modelLoadId: {
      type: STRING,
      allowNull: true
    },
    modelLoad: {
      type: STRING
    },
    modelLoadParams: {
      type: STRING
    },
    modelTrainId: {
      type: STRING,
      allowNull: true
    },
    modelTrain: {
      type: STRING
    },
    modelTrainParams: {
      type: STRING
    },
    modelEvaluateId: {
      type: STRING,
      allowNull: true
    },
    modelEvaluate: {
      type: STRING
    },
    modelEvaluateParams: {
      type: STRING
    }
  },
  {
    sequelize,
    modelName: 'pipeline'
  });
  PipelineModel.hasMany(JobModel);
  await PipelineModel.sync();
}
