'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SurveyResponse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      SurveyResponse.belongsTo(models.Survey, {
        foreignKey: 'surveyId',
        as: 'survey'
      });

      SurveyResponse.belongsTo(models.Facility, {
        foreignKey: 'facilityId',
        as: 'facility'
      });

      SurveyResponse.hasMany(models.QuestionResponse, {
        foreignKey: 'surveyResponseId',
        as: 'questionResponses'
      });
    }
  }
  SurveyResponse.init({
    surveyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Surveys',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    facilityId: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Facilities',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'SurveyResponse',
  });
  return SurveyResponse;
};