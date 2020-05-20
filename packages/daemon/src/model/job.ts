import { STRING, INTEGER, BOOLEAN, Model, BuildOptions } from 'sequelize';
import { providerWrapper, IApplicationContext } from 'midway';
import DB from './init';

providerWrapper([
  {
    id: 'jobModel',
    provider: model
  }
]);

export class JobModel extends Model {
  readonly id: string;
  readonly pipelineId: string;
  readonly coreVersion: string;
  readonly status: number;
  readonly metadata: number;
  readonly evaluateMap: string;
  readonly evaluatePass: boolean;
  readonly currentIndex: number;
  readonly error: string;
  readonly endTime: number;
}

export type JobModelStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): JobModel;
}

export default async function model(context: IApplicationContext): Promise<JobModelStatic> {
  const db = await context.getAsync('pipcookDB') as DB;
  const JobModel = <JobModelStatic>db.sequelize.define('job', {
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
    coreVersion: {
      type: STRING,
      field: 'core_version',
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
  });
  await JobModel.sync();
  return JobModel;
}
