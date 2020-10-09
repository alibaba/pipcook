'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async t => {
      const tbNames = await queryInterface.showAllTables();
      if (tbNames.indexOf('plugins') >= 0) {
        const columns = await queryInterface.describeTable('plugins');
        return !columns['md5'] && queryInterface.addColumn('plugins', 'md5', {
          type: DataTypes.STRING,
          allowNull: true
        }, { transaction: t });
      }
    });
  }
};
