'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tableNames = await queryInterface.showAllTables();
      if (tableNames.indexOf('pipelines') >= 0) {
        const tables = await queryInterface.describeTable('pipelines');
        return Promise.all([
          !tables['datasetProcess'] && queryInterface.addColumn('pipelines', 'datasetProcess', {
            type: DataTypes.STRING
          }, { transaction: t }),
          !tables['datasetProcess'] && queryInterface.addColumn('pipelines', 'datasetProcessParams', {
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
        const tables = await queryInterface.describeTable('pipelines');
        tables['datasetProcess'] && await queryInterface.removeColumn('pipelines', 'datasetProcess', { transaction: t });
        tables['datasetProcess'] && await queryInterface.removeColumn('pipelines', 'datasetProcessParams', { transaction: t });
      }
    });
  }
};
