'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ward extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Ward.belongsTo(models.District, {
        foreignKey: 'districtId',
        as: 'district'
      });

      Ward.hasMany(models.Municipality, {
        foreignKey: 'wardId',
        as: 'municipalities'
      });

      Ward.hasMany(models.UserJurisdiction, {
        foreignKey: 'wardId',
        as: 'jurisdictions'
      });
    }
  }
  Ward.init({
    name: { 
      type: DataTypes.STRING,
      allowNull: false
    },
    districtId: { 
      type: DataTypes.INTEGER,
      references: {
        model: 'Districts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    sequelize,
    modelName: 'Ward',
  });
  return Ward;
};