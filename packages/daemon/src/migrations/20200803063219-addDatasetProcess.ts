'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.addColumn('pipelines', 'datasetProcess', {
          type: Sequelize.DataTypes.STRING
        }, { transaction: t }),
        queryInterface.addColumn('pipelines', 'datasetProcessParams', {
          type: Sequelize.DataTypes.STRING
        }, { transaction: t })
      ])
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(t => {
      return queryInterface.removeColumn('pipelines', 'datasetProcess', { transaction: t }).then(() => {
        return queryInterface.removeColumn('pipelines', 'datasetProcessParams', { transaction: t });
      })
    });
  }
};
