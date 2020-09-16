import { STRING, INTEGER, BOOLEAN, Model, Sequelize } from 'sequelize';
import { PipelineStatus, generateId } from '@pipcook/pipcook-core';

interface IParam {
  pluginType: string;
  pluginParam: string;
}

export interface JobEntity {
  id: string;
  pipelineId: string;
  specVersion: string;
  metadata: number;

  evaluateMap?: string;
  evaluatePass?: boolean;
  currentIndex: number;
  error?: string;
  endTime?: number;
  status?: number;
  dataset?: string;

  params?: IParam[];
}

interface QueryOptions {
  limit: number;
  offset: number;
}

interface SelectJobsFilter {
  pipelineId?: string;
}

export class JobModel extends Model {

  private static __packJob(job: any): JobEntity {
    job.params = JSON.parse(job.params);
    return job as JobEntity;
  }

  static async getJobById(id: string): Promise<JobEntity> {
    const internalJob = (await JobModel.findOne({
      where: { id }
    }))?.toJSON();
    return this.__packJob(internalJob);
  }

  static async saveJob(job: JobEntity): Promise<void> {
    const params = job.params ? JSON.stringify(job.params) : '';
    JobModel.update({
      ...job,
      params
    }, { where: { id: job.id } });
  }

  static async getJobsByPipelineId(pipelineId: string): Promise<JobEntity[]> {
    return (await JobModel.findAll({
      where: { pipelineId }
    })).map(job => this.__packJob(job.toJSON()));
  }

  static async queryJobs(filter: SelectJobsFilter, opts?: QueryOptions): Promise<JobEntity[]> {
    const where = {} as any;
    const { offset, limit } = opts || {};
    if (typeof filter.pipelineId === 'string') {
      where.pipelineId = filter.pipelineId;
    }
    return (await JobModel.findAll({
      offset,
      limit,
      where,
      order: [
        [ 'createdAt', 'DESC' ]
      ]
    })).map(job => this.__packJob(job.toJSON()));
  }

  static async removeJobs(): Promise<number> {
    return JobModel.destroy({ truncate: true });
  }

  static async removeJobById(id: string): Promise<number> {
    return JobModel.destroy({ where: { id }});
  }

  static async removeJobByModels(jobs: JobEntity[]): Promise<number> {
    const ids = jobs.map(job => job.id);
    return JobModel.destroy({
      where: {
        id: ids
      }
    });
  }

  static async createJob(pipelineId: string, specVersion: string, params?: string): Promise<JobEntity> {
    const job = await JobModel.create({
      id: generateId(),
      pipelineId,
      specVersion,
      status: PipelineStatus.INIT,
      currentIndex: -1,
      params: params.length !== 0 ? params : '[]'
    });
    return this.__packJob(job.toJSON());
  }
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
    },
    params: {
      type: STRING
    }
  },
  {
    sequelize,
    modelName: 'job'
  });
  await JobModel.sync();
}
