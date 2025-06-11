'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addConstraint('Municipalities', {
      fields: ['wardId'],
      type: 'foreign key',
      name: 'Municipalities_wardId_fkey',
      references: {
        table: 'Wards',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('Wards', {
      fields: ['districtId'],
      type: 'foreign key',
      name: 'Wards_districtId_fkey',
      references: {
        table: 'Districts',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addConstraint('Districts', {
      fields: ['regionId'],
      type: 'foreign key',
      name: 'Districts_regionId_fkey',
      references: {
        table: 'Regions',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('Municipalities', 'Municipalities_wardId_fkey');
    await queryInterface.removeConstraint('Wards', 'Wards_districtId_fkey');
    await queryInterface.removeConstraint('Districts', 'Districts_wardId_fkey');
  }
};
