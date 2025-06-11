'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserJurisdiction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UserJurisdiction.belongsTo(models.Municipality, {
        foreignKey: 'municipalityId',
        as: 'municipality'
      });

      UserJurisdiction.belongsTo(models.Ward, {
        foreignKey: 'wardId',
        as: 'ward'
      });


      UserJurisdiction.belongsTo(models.District, {
        foreignKey: 'districtId',
        as: 'district'
      });


      UserJurisdiction.belongsTo(models.Region, {
        foreignKey: 'regionId',
        as: 'region'
      });

      UserJurisdiction.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

    }
  }
  UserJurisdiction.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    // TODO: allowNull settings depending on 
    // HOW LOCATION WILL WORK AND 
    // WHETHER WE ALLOW A USER TO NOT HAVE 
    // A SPECIFIC MUNICIPALITY FOR EXAMPLE.
    regionId: { 
      type: DataTypes.INTEGER,
      references: {
        model: 'Regions',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    districtId: { 
      type: DataTypes.INTEGER,
      references: {
        model: 'Districts',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    wardId: { 
      type: DataTypes.INTEGER,
      references: {
        model: 'Wards',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    municipalityId: { 
      type: DataTypes.INTEGER,
      references: {
        model: 'Municipalities',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'UserJurisdiction',
  });
  return UserJurisdiction;
};