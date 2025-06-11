'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuestionCategory extends Model {
    static associate(models) {
      // define association here
      QuestionCategory.hasMany(models.Question, {
        foreignKey: 'categoryId',
        as: 'questions'
      });
    }
  }
  QuestionCategory.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'QuestionCategory',
  });
  return QuestionCategory;
};