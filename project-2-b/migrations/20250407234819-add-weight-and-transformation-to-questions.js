'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Questions', 'weight', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 1.0
    });

    await queryInterface.addColumn('Questions', 'transformation', {
      type: Sequelize.ENUM('none', 'square', 'sqrt', 'inverse'),
      allowNull: false,
      defaultValue: 'none'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Questions', 'weight');
    await queryInterface.removeColumn('Questions', 'transformation');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Questions_transformation";');
  }
};
