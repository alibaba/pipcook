import { STRING, INTEGER, BOOLEAN, Model, BuildOptions } from 'sequelize';
import { providerWrapper, IApplicationContext } from 'midway';
import DB from '../boot/database';

providerWrapper([
  {
    id: 'jobModel',
    provider: model
  }
]);

export class JobModel extends Model {
  readonly id: string;
  readonly pipelineId: string;
  readonly specVersion: string;
  readonly status: number;
  readonly metadata: number;

  evaluateMap: string;
  evaluatePass: boolean;
  currentIndex: number;
  error: string;
  endTime: number;
}

export type JobModelStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): JobModel;
};

export default async function model(context: IApplicationContext): Promise<JobModelStatic> {
  const db = await context.getAsync('pipcookDB') as DB;
  const JobModel = db.sequelize.define('job', {
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
    error: {
      type: STRING
    },
    endTime: {
      type: INTEGER
    }
  }) as JobModelStatic;
  await JobModel.sync();
  return JobModel;
}
