'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserJurisdictions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      // TODO: allowNull settings depending on 
      // HOW LOCATION WILL WORK AND 
      // WHETHER WE ALLOW A USER TO NOT HAVE 
      // A SPECIFIC MUNICIPALITY FOR EXAMPLE.
      region: { 
        type: Sequelize.INTEGER,
        references: {
          model: 'Regions',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      district: { 
        type: Sequelize.INTEGER,
        references: {
          model: 'Districts',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      ward: { 
        type: Sequelize.INTEGER,
        references: {
          model: 'Wards',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      municipality: { 
        type: Sequelize.INTEGER,
        references: {
          model: 'Municipalities',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserJurisdictions');
  }
};