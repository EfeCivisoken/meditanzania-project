'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Municipality extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Municipality.belongsTo(models.Ward, {
        foreignKey: 'wardId',
        as: 'ward'
      });

      Municipality.hasMany(models.Facility, {
        foreignKey: 'municipalityId',
        as: 'facilities'
      });

      Municipality.hasMany(models.UserJurisdiction, {
        foreignKey: 'municipalityId',
        as: 'jurisdictions'
      });
    }
  }
  Municipality.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    wardId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Wards',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    sequelize,
    modelName: 'Municipality',
  });
  return Municipality;
};