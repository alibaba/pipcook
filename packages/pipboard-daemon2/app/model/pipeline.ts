export default async function model(app) {
  const { STRING, INTEGER, BOOLEAN } = app.Sequelize;

  const Pipeline = app.model.define('pipeline', {
    id: {
      type: INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    coreVersion: {
      type: STRING,
      field: 'core_version',
      allowNull: false,
    },
    status: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    evaluateMap: {
      type: STRING,
    },
    evaluatePass: {
      type: BOOLEAN,
    },
    currentIndex: {
      type: INTEGER,
      allowNull: false,
      defaultValue: -1,
    },
    error: {
      type: STRING,
    },
    createTime: {
      type: STRING,
      allowNull: false,
      defaultValue: Date.now()
    },
    endTime: {
      type: STRING,
    },
    dataCollect: {
      type: STRING,
    },
    dataAccess: {
      type: STRING,
    },
    dataProcess: {
      type: STRING,
    },
    modelDefine: {
      type: STRING,
    },
    modelLoad: {
      type: STRING,
    },
    modelTrain: {
      type: STRING,
    },
    modelEvaluate: {
      type: STRING,
    }
  });

  return Pipeline;
}