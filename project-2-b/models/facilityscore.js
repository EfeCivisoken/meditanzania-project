'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FacilityScore extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      FacilityScore.belongsTo(models.Facility, {
        foreignKey: 'facilityId',
        as: 'facility'
      });

      FacilityScore.belongsTo(models.QuestionCategory, {
        foreignKey: 'categoryId',
        as: 'category'
      });
    }
  }
  FacilityScore.init({
    facilityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Facilities',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'QuestionCategories',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'FacilityScore',
  });
  return FacilityScore;
};