'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Question.belongsTo(models.Survey, {
        foreignKey: 'surveyId',
        as: 'survey'
      });

      Question.belongsTo(models.QuestionCategory, {
        foreignKey: 'categoryId',
        as: 'category'
      });
    }
  }
  Question.init({
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
    text: { 
      type: DataTypes.STRING,
      allowNull: false
    },
    textResponse: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0
    },
    transformation: {
      type: DataTypes.ENUM('none', 'square', 'sqrt', 'inverse'),
      allowNull: false,
      defaultValue: 'none'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'QuestionCategories',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};