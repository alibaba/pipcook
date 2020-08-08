'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tbNames = await queryInterface.showAllTables();
      if (tbNames.indexOf('plugin') > 0) {
        return Promise.all([
          queryInterface.addColumn('plugin', 'status', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          }, { transaction: t }),
          queryInterface.addColumn('plugin', 'error', {
            type: DataTypes.STRING
          }, { transaction: t })
        ]);
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tbNames = await queryInterface.showAllTables();
      if (tbNames.indexOf('plugin') > 0) {
        await queryInterface.removeColumn('plugin', 'status', { transaction: t });
        await queryInterface.removeColumn('plugin', 'error', { transaction: t });
      }
    });
  }
};
