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
        if (!columns['from']) {
          futures.push(queryInterface.addColumn('plugins', 'from', {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'npm'
          }, { transaction: t }));
        }
        if (!columns['uri']) {
          futures.push(queryInterface.addColumn('plugins', 'uri', {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
          }, { transaction: t }));
        }
      }
      return Promise.all(futures);
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
        if (columns['from']) {
          futures.push(queryInterface.removeColumn('plugins', 'from', { transaction: t }));
        }
      }
      if (tbNames.indexOf('plugins') >= 0) {
        const columns = await queryInterface.describeTable('plugins');
        if (columns['uri']) {
          futures.push(queryInterface.removeColumn('plugins', 'uri', { transaction: t }));
        }
      }
      return Promise.all(futures);
    });
  }
};
