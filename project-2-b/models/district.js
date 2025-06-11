'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class District extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      District.belongsTo(models.Region, {
        foreignKey: 'regionId',
        as: 'region'
      });

      District.hasMany(models.Ward, {
        foreignKey: 'districtId',
        as: 'wards'
      });

      District.hasMany(models.UserJurisdiction, {
        foreignKey: 'districtId',
        as: 'jurisdictions'
      });
    }
  }
  District.init({
    name: { 
      type: DataTypes.STRING,
      allowNull: false,
    },
    regionId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Regions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    sequelize,
    modelName: 'District',
  });
  return District;
};