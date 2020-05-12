
/**
 * Copyright(c) Alibaba Group Holding Limited.
 *
 *
 * Classification Model
 */

import * as Sequelize from 'sequelize';
import { providerWrapper } from 'midway';
const { STRING, INTEGER, BOOLEAN } = Sequelize;

providerWrapper([
  {
    id: 'runModel',
    provider: model
  }
]);

export default async function model(context) {
  const db = await context.getAsync('pipcookDB');

  const Run = db.sequelize.define('run', {
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

  return Run;
}
