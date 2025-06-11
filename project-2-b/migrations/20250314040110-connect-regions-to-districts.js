'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint('Districts', {
      fields: ['regionId'],
      type: 'foreign key',
      name: 'fk_districts_regionId', // optional: provide a custom name for the constraint
      references: {
        table: 'Regions',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Districts', 'fk_districts_regionId');
  }
};
