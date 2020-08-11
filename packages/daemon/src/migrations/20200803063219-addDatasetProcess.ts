'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tableNames = await queryInterface.showAllTables();
      if (tableNames.indexOf('pipelines') >= 0) {
        const columns = await queryInterface.describeTable('pipelines');
        return Promise.all([
          !columns['datasetProcess'] && queryInterface.addColumn('pipelines', 'datasetProcess', {
            type: DataTypes.STRING
          }, { transaction: t }),
          !columns['datasetProcess'] && queryInterface.addColumn('pipelines', 'datasetProcessParams', {
            type: DataTypes.STRING
          }, { transaction: t })
        ]);
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tableNames = await queryInterface.showAllTables();
      if (tableNames.indexOf('pipelines') >= 0) {
        const columns = await queryInterface.describeTable('pipelines');
        columns['datasetProcess'] && await queryInterface.removeColumn('pipelines', 'datasetProcess', { transaction: t });
        columns['datasetProcess'] && await queryInterface.removeColumn('pipelines', 'datasetProcessParams', { transaction: t });
      }
    });
  }
};