'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('pipelines', 'datasetProcess', {
          type: DataTypes.STRING
        }, { transaction: t }),
        queryInterface.addColumn('pipelines', 'datasetProcessParams', {
          type: DataTypes.STRING
        }, { transaction: t })
      ])
    })
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(t => {
      return queryInterface.removeColumn('pipelines', 'datasetProcess', { transaction: t }).then(() => {
        return queryInterface.removeColumn('pipelines', 'datasetProcessParams', { transaction: t });
      })
    });
  }
};
