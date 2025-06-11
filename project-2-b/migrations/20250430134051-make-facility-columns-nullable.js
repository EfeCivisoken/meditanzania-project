'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'ALTER TABLE Facilities RENAME TO Facilities_backup;',
        { transaction }
      );

      await queryInterface.sequelize.query(
        `CREATE TABLE Facilities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          commonName TEXT,
          type TEXT,
          status TEXT,
          phoneNumber TEXT,
          address TEXT,
          email TEXT,
          website TEXT,
          longitude FLOAT,
          latitude FLOAT,
          municipalityId INTEGER NOT NULL,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (municipalityId) REFERENCES Municipalities(id)
        );`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO Facilities (id, name, commonName, type, status, phoneNumber, address, email, website, longitude, latitude, municipalityId, createdAt, updatedAt)
         SELECT id, name, commonName, type, status, phoneNumber, address, email, website, longitude, latitude, municipalityId, createdAt, updatedAt FROM Facilities_backup;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        'DROP TABLE Facilities_backup;',
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'ALTER TABLE Facilities RENAME TO Facilities_backup;',
        { transaction }
      );

      await queryInterface.sequelize.query(
        `CREATE TABLE Facilities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          commonName TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          phoneNumber TEXT NOT NULL,
          address TEXT NOT NULL,
          email TEXT NOT NULL,
          website TEXT NOT NULL,
          longitude FLOAT NOT NULL,
          latitude FLOAT NOT NULL,
          municipalityId INTEGER NOT NULL,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (municipalityId) REFERENCES Municipalities(id)
        );`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO Facilities (id, name, commonName, type, status, phoneNumber, address, email, website, longitude, latitude, municipalityId, createdAt, updatedAt)
         SELECT id, name, commonName, type, status, phoneNumber, address, email, website, longitude, latitude, municipalityId, createdAt, updatedAt FROM Facilities_backup;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        'DROP TABLE Facilities_backup;',
        { transaction }
      );
    });
  }
};