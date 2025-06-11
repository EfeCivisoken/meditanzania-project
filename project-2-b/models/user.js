'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
      User.hasOne(models.UserJurisdiction, {
        foreignKey: 'userId',
        as: 'jurisdiction'
      });

      User.belongsTo(models.Facility, {
        foreignKey: 'worksAt',
        as: 'facility'
      });

      User.hasMany(models.Post, {
        foreignKey: 'userId', 
        as: 'posts' 
      });

    }
  }
  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    worksAt: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Facilities',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};