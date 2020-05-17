
/**
 * Copyright(c) Alibaba Group Holding Limited.
 *
 *
 * Classification Model
 */

import * as Sequelize from 'sequelize';
import { providerWrapper } from 'midway';
const { STRING } = Sequelize;

providerWrapper([
  {
    id: 'pipelineModel',
    provider: model
  }
]);

export default async function model(context) {
  const db = await context.getAsync('pipcookDB');
  const RunModel = await context.getAsync('runModel');

  const Pipeline = db.sequelize.define('pipeline', {
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
  });

  Pipeline.hasMany(RunModel);
  return Pipeline;
}
