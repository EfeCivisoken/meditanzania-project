# Migrations

Database schema changes are tracked and applied using migrations.

```zsh
yarn sequelize model:generate --name <ModelName> --attributes attr1:type ...
```

This will generate a model and a migration. **But don't migrate yet!** We still need to fully configure our model. If we need a foreign key, for example, we'll need to manually configure that.

Take for example `district.js`:

```javascript
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

            District.belongsTo(models.Region, { // exposes getRegion() method
                foreignKey: 'regionId',
                as: 'region'
            });

            District.hasMany(models.Ward, { // exposes getWards() method
                foreignKey: 'districtId',
                as: 'wards'
            });
        }
    }
    District.init({ // define columns here
        name: { 
            type: DataTypes.STRING,
            allowNull: false,
        },
        regionId: {
            type: DataTypes.INTEGER,
            // Begin Foreign Key Setup
            references: { 
                model: 'Regions', 
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
            // End
        }
    }, {
        sequelize,
        modelName: 'District',
    });
    return District;
};
```

This is what a (complete) migration file will look like:

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Districts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      regionId: {
        type: Sequelize.INTEGER,
        // --- This code creates the foreign key constraint.
        references: {
          model: 'Regions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
        // ---
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Districts');
  }
};
```

If you've already committed a migration to the repository, it is improper to edit it. Instead, create a new migration with the necessary changes:

```zsh
yarn sequelize migration:generate --name update-districts-add-region-id-foreign-key
```

This results in the file `YYYYMMDDHHMMSS-name.js` in the `migrations` directory.

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};

```

You might modify it to look like this:

```javascript
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.addConstraint('Districts', {
            fields: ['regionId'],
            type: 'foreign key',
            name: 'fk_districts_regionId', // optional: provide a custom name for the constraint
            references: {
                table: 'Regions',
                field: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.removeConstraint('Districts', 'fk_districts_regionId');
    }
};
```

Once everything's all squared away, you might consider writing some tests in the `/tests` directory. When they're passing, you can migrate the changes to your local database:

```zsh
yarn sequelize db:migrate
```

Then, you'd commit the changes to GitHub.
