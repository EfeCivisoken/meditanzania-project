'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop the AlternativeFeedbacks table
    await queryInterface.dropTable('AlternativeFeedbacks');
  },

  async down (queryInterface, Sequelize) {
    // Recreate the AlternativeFeedbacks table
    await queryInterface.createTable('AlternativeFeedbacks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      text: {
        type: Sequelize.STRING
      },
      facilityId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Facilities',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  }
};
