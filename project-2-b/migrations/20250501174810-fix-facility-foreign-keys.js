'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        type TEXT,
        name TEXT,
        worksAt INTEGER,
        createdAt DATE,
        updatedAt DATE,
        FOREIGN KEY (worksAt) REFERENCES Facilities(id) ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    await queryInterface.sequelize.query(`
      INSERT INTO Users_new (id, email, passwordHash, type, name, worksAt)
      SELECT id, email, passwordHash, type, name, worksAt FROM Users;
    `);
    await queryInterface.sequelize.query(`DROP TABLE Users;`);
    await queryInterface.sequelize.query(`ALTER TABLE Users_new RENAME TO Users;`);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS SurveyResponses_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        surveyId INTEGER,
        facilityId INTEGER,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (surveyId) REFERENCES Surveys(id) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (facilityId) REFERENCES Facilities(id) ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    await queryInterface.sequelize.query(`
      INSERT INTO SurveyResponses_new (id, surveyId, facilityId, createdAt, updatedAt)
      SELECT id, surveyId, facilityId, createdAt, updatedAt FROM SurveyResponses;
    `);
    await queryInterface.sequelize.query(`DROP TABLE SurveyResponses;`);
    await queryInterface.sequelize.query(`ALTER TABLE SurveyResponses_new RENAME TO SurveyResponses;`);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS FacilityScores_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        score INTEGER,
        facilityId INTEGER,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        categoryId INTEGER,
        FOREIGN KEY (facilityId) REFERENCES Facilities(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES QuestionCategories(id) ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    await queryInterface.sequelize.query(`
      INSERT INTO FacilityScores_new (id, score, facilityId, createdAt, updatedAt, categoryId)
      SELECT id, score, facilityId, createdAt, updatedAt, categoryId FROM FacilityScores;
    `);
    await queryInterface.sequelize.query(`DROP TABLE FacilityScores;`);
    await queryInterface.sequelize.query(`ALTER TABLE FacilityScores_new RENAME TO FacilityScores;`);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Users', 'Users_worksAt_Facilities_fk');
    await queryInterface.removeConstraint('AlternativeFeedbacks', 'AlternativeFeedbacks_facilityId_Facilities_fk');
    await queryInterface.removeConstraint('SurveyResponses', 'SurveyResponses_facilityId_Facilities_fk');
    await queryInterface.removeConstraint('FacilityScores', 'FacilityScores_facilityId_Facilities_fk');
  }
};
