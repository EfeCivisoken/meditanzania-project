'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuestionResponse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      QuestionResponse.belongsTo(models.Question, {
        foreignKey: 'questionId',
        as: 'question'
      });

      QuestionResponse.belongsTo(models.SurveyResponse, {
        foreignKey: 'surveyResponseId',
        as: 'surveyResponse'
      });

    }
  }
  QuestionResponse.init({
    questionId: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Questions',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    surveyResponseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'SurveyResponses',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    responseInt: DataTypes.INTEGER,
    responseText: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'QuestionResponse',
  });
  return QuestionResponse;
};