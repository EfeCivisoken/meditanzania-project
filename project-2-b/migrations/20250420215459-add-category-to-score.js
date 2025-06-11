'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('FacilityScores', 'categoryId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'QuestionCategories',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('FacilityScores', 'categoryId');
  }
};
