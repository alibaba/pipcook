import { STRING, Model, BuildOptions } from 'sequelize';
import { providerWrapper, IApplicationContext } from 'midway';
import { JobModelStatic } from './job';
import DB from './init';

providerWrapper([
  {
    id: 'pipelineModel',
    provider: model
  }
]);

export class PipelineModel extends Model {
  readonly id: string;
  readonly name: string;
  readonly dataCollect: string;
  readonly dataCollectParams: string;
  readonly dataAccess: string;
  readonly dataAccessParams: string;
  readonly dataProcess: string;
  readonly dataProcessParams: string;
  readonly modelDefine: string;
  readonly modelDefineParams: string;
  readonly modelLoad: string;
  readonly modelLoadParams: string;
  readonly modelTrain: string;
  readonly modelTrainParams: string;
  readonly modelEvaluate: string;
  readonly modelEvaluateParams: string;
}

export type PipelineModelStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): PipelineModel;
};

export default async function model(context: IApplicationContext): Promise<PipelineModelStatic> {
  const db = await context.getAsync('pipcookDB') as DB;
  const JobModel = await context.getAsync('jobModel') as JobModelStatic;
  const PipelineModel = db.sequelize.define('pipeline', {
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
    dataCollect: {
      type: STRING
    },
    dataCollectParams: {
      type: STRING
    },
    dataAccess: {
      type: STRING
    },
    dataAccessParams: {
      type: STRING
    },
    dataProcess: {
      type: STRING
    },
    dataProcessParams: {
      type: STRING
    },
    modelDefine: {
      type: STRING
    },
    modelDefineParams: {
      type: STRING
    },
    modelLoad: {
      type: STRING
    },
    modelLoadParams: {
      type: STRING
    },
    modelTrain: {
      type: STRING
    },
    modelTrainParams: {
      type: STRING
    },
    modelEvaluate: {
      type: STRING
    },
    modelEvaluateParams: {
      type: STRING
    }
  }) as PipelineModelStatic;
  PipelineModel.hasMany(JobModel);
  await PipelineModel.sync();
  return PipelineModel;
}
