'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Post.belongsTo(models.Facility, {
        foreignKey: 'facilityId',
        as: 'facility'
      });
      
      Post.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  Post.init({
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    facilityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Facilities',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Post',
  });
  return Post;
};