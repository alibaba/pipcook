'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tbNames = await queryInterface.showAllTables();
      if (tbNames.indexOf('plugins') >= 0) {
        const columns = await queryInterface.describeTable('plugins');
        return Promise.all([
          !columns['status'] && queryInterface.addColumn('plugins', 'status', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          }, { transaction: t }),
          !columns['error'] && queryInterface.addColumn('plugins', 'error', {
            type: DataTypes.STRING
          }, { transaction: t })
        ]);
      }
    });
  }
};
