'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tbNames = await queryInterface.showAllTables();
      if (tbNames.indexOf('pipelines') > 0) {
        return Promise.all([
          queryInterface.addColumn('pipelines', 'datasetProcess', {
            type: DataTypes.STRING
          }, { transaction: t }),
          queryInterface.addColumn('pipelines', 'datasetProcessParams', {
            type: DataTypes.STRING
          }, { transaction: t })
        ]);
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tableNames = await queryInterface.showAllTables();
      if (tbNames.indexOf('pipelines') > 0) {
        await queryInterface.removeColumn('pipelines', 'datasetProcess', { transaction: t });
        await queryInterface.removeColumn('pipelines', 'datasetProcessParams', { transaction: t });
      }
    });
  }
};
