'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Facilities', 'longitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn('Facilities', 'latitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Facilities', 'longitude');
    await queryInterface.removeColumn('Facilities', 'latitude');
  }
};
