'use strict';
import { QueryInterface, DataTypes, Promise } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tbNames = await queryInterface.showAllTables();
      const futures = [];
      if (tbNames.indexOf('pipelines') >= 0) {
        const columns = await queryInterface.describeTable('pipelines');
        const addColumn = async function (columnName: string) {
          return !columns[columnName] && queryInterface.addColumn('pipelines', columnName, {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
          }, { transaction: t });
        };
        futures.push(Promise.all([
          addColumn('dataCollectId'),
          addColumn('dataAccessId'),
          addColumn('dataProcessId'),
          addColumn('datasetProcessId'),
          addColumn('modelDefineId'),
          addColumn('modelLoadId'),
          addColumn('modelTrainId'),
          addColumn('modelEvaluateId')
        ]));
      }
      if (tbNames.indexOf('plugins') >= 0) {
        const columns = await queryInterface.describeTable('plugins');
        if (!columns['sourceFrom']) {
          futures.push(queryInterface.addColumn('plugins', 'sourceFrom', {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'npm'
          }, { transaction: t }));
        }
        if (!columns['sourceUri']) {
          futures.push(queryInterface.addColumn('plugins', 'sourceUri', {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
          }, { transaction: t }));
        }
      }
      await Promise.all(futures);
      const types = [ 'dataCollect', 'dataAccess', 'dataProcess',
        'datasetProcess', 'modelDefine', 'modelLoad', 'modelTrain', 'modelEvaluate' ];
      for (const type of types) {
        await queryInterface.sequelize.query(
          `update pipelines set ${type}Id = (select id from plugins where pipelines.${type} = plugins.name limit 1)`
        );
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tbNames = await queryInterface.showAllTables();
      const futures = [];
      if (tbNames.indexOf('pipelines') >= 0) {
        const columns = await queryInterface.describeTable('pipelines');
        const removeColumn = async function (columnName: string) {
          return columns[columnName]
            && queryInterface.removeColumn('pipelines', columnName, { transaction: t });
        };
        futures.push(Promise.all([
          removeColumn('dataCollectId'),
          removeColumn('dataAccessId'),
          removeColumn('dataProcessId'),
          removeColumn('datasetProcessId'),
          removeColumn('modelDefineId'),
          removeColumn('modelLoadId'),
          removeColumn('modelTrainId'),
          removeColumn('modelEvaluateId')
        ]));
      }
      if (tbNames.indexOf('plugins') >= 0) {
        const columns = await queryInterface.describeTable('plugins');
        if (columns['sourceFrom']) {
          futures.push(queryInterface.removeColumn('plugins', 'sourceFrom', { transaction: t }));
        }
      }
      if (tbNames.indexOf('plugins') >= 0) {
        const columns = await queryInterface.describeTable('plugins');
        if (columns['sourceUri']) {
          futures.push(queryInterface.removeColumn('plugins', 'sourceUri', { transaction: t }));
        }
      }
      return Promise.all(futures);
    });
  }
};
