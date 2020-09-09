import { STRING, Model, Sequelize, Op } from 'sequelize';
import { generateId } from '@pipcook/pipcook-core';
import { JobModel } from './job';
import { UpdateParameter } from '../interface/pipeline';

export interface PipelineEntity {
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

export interface QueryOptions {
  limit: number;
  offset: number;
}

export class PipelineModel extends Model {
  static async createPipeline(config: PipelineEntity): Promise<PipelineEntity> {
    if (typeof config.id !== 'string') {
      config.id = generateId();
    }
    return (await PipelineModel.create(config))?.toJSON() as PipelineEntity;
  }

  static async getPipeline(idOrName: string): Promise<PipelineEntity> {
    return (await PipelineModel.findOne({
      where: { [Op.or]: [ { id: idOrName }, { name: idOrName } ] }
    }))?.toJSON() as PipelineEntity;
  }

  static async queryPipelines(opts?: QueryOptions): Promise<PipelineEntity[]> {
    const { offset, limit } = opts || {};
    return (await PipelineModel.findAll({
      offset,
      limit,
      order: [
        [ 'createdAt', 'DESC' ]
      ],
      include: [
        {
          all: true
        }
      ]
    })).map(pipeline => pipeline.toJSON() as PipelineEntity);
  }

  static async removePipelineById(id: string): Promise<number> {
    return PipelineModel.destroy({
      where: { id }
    });
  }

  static async removePipelines(): Promise<number> {
    return PipelineModel.destroy({ truncate: true });
  }

  static async updatePipelineById(id: string, config: UpdateParameter): Promise<PipelineEntity> {
    const [ number, pipelines ] = await PipelineModel.update(config, {
      where: { id }
    });
    return number > 0 ? pipelines[0].toJSON() as PipelineEntity : undefined;
  }
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
