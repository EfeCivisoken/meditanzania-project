'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('UserJurisdictions', 'region', 'regionId');
    await queryInterface.renameColumn('UserJurisdictions', 'district', 'districtId');
    await queryInterface.renameColumn('UserJurisdictions', 'ward', 'wardId');
    await queryInterface.renameColumn('UserJurisdictions', 'municipality', 'municipalityId');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('UserJurisdictions', 'regionId', 'region');
    await queryInterface.renameColumn('UserJurisdictions', 'districtId', 'district');
    await queryInterface.renameColumn('UserJurisdictions', 'wardId', 'ward');
    await queryInterface.renameColumn('UserJurisdictions', 'municipalityId', 'municipality');
  }
};
