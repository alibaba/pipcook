'use strict';
import { QueryInterface, DataTypes, Promise } from 'sequelize';

const types = [ 'dataCollect', 'dataAccess', 'dataProcess',
      'datasetProcess', 'modelDefine', 'modelLoad', 'modelTrain', 'modelEvaluate' ];

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tbNames = await queryInterface.showAllTables();
      if (tbNames.indexOf('pipelines') >= 0) {
        const columns = await queryInterface.describeTable('pipelines');
        const addColumn = async function (columnName: string) {
          return !columns[columnName] && queryInterface.addColumn('pipelines', columnName, {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
          }, { transaction });
        };
        for (const type of types) {
            await addColumn(`${type}Id`);
        }
      }
      if (tbNames.indexOf('plugins') >= 0) {
        const columns = await queryInterface.describeTable('plugins');
        if (!columns['sourceFrom']) {
          await queryInterface.addColumn('plugins', 'sourceFrom', {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'npm'
          }, { transaction });
        }
        if (!columns['sourceUri']) {
          await queryInterface.addColumn('plugins', 'sourceUri', {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: ''
          }, { transaction });
        }
      }
      // commit the table changes, otherwise there will throw an error 'no column dataCollect'
      await transaction.commit();
      try {
        for (const type of types) {
          await queryInterface.sequelize.query(
            `update pipelines set ${type}Id = (select id from plugins where pipelines.${type} = plugins.name limit 1)`
          );
        }
      } catch (err) {
        console.warn('some error occurred when update plugin id in pipeline table: ', err);
      }
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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
