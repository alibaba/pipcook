'use strict';
import { QueryInterface, DataTypes } from 'sequelize';

const types = [ 'params' ];

export default {
  up: async (queryInterface: QueryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tbNames = await queryInterface.showAllTables();
      if (tbNames.indexOf('jobs') >= 0) {
        const columns = await queryInterface.describeTable('jobs');
        const addColumn = async function (columnName: string) {
          return !columns[columnName] && queryInterface.addColumn('jobs', columnName, {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null
          }, { transaction });
        };
        for (const type of types) {
            await addColumn(type);
        }
      }
      // commit the table changes, otherwise there will throw an error 'no column dataCollect'
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};