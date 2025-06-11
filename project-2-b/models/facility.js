'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Facility extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Facility.belongsTo(models.Municipality, {
        foreignKey: 'municipalityId',
        as: 'location'
      });

      Facility.hasMany(models.User, {
        foreignKey: 'worksAt',
        as: 'employees'
      });

      Facility.hasMany(models.SurveyResponse, {
        foreignKey: 'facilityId',
        as: 'surveyResponses'
      });

      Facility.hasMany(models.FacilityScore, {
        foreignKey: 'facilityId',
        as: 'scores'
      });

      Facility.hasMany(models.Post, {
        foreignKey: 'facilityId',
        as: 'posts'
      });
    };
    
  }
  Facility.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    commonName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    municipalityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Municipalities',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'Facility',
  });
  return Facility;
};