# Sequelize CLI

This file explains how to use the database migration system we'll use.

Read more [here](https://sequelize.org/docs/v6/other-topics/migrations/).

## What to Do When You Pull the Repository

1. **Install dependencies** (if it's your first time pulling or if dependencies have changed):

    ```sh
    yarn install
    ```

2. **Ensure your database is up to date by running migrations**:

    ```sh
    npx sequelize-cli db:migrate
    ```

3. **(Optional) If seed data (data inserted into the tables) is needed, run**:

    ```sh
    npx sequelize-cli db:seed:all
    ```

## What to Do Before You Push

1. **Ensure your database changes are committed**:

    - When you create a new model, run:

        ```sh
        npx sequelize-cli model:generate --name ModelName --attributes field:type
        ```

        - It is also in this file where you'll set up the model.

    - If you made changes to models, ensure corresponding migration files are created and updated. You may need to create migration files using

    ```zsh
    yarn sequelize migration:generate --name <name>
    ```

    You'll need to manually define any associations formed in files like this.

2. **Run migrations locally to confirm they work**:

    ```sh
    npx sequelize-cli db:migrate
    ```

3. **If new seed data is needed, generate a seed file**:

    ```sh
    npx sequelize-cli seed:generate --name seedName
    ```

    Then modify the generated file and apply the seed:

    ```sh
    npx sequelize-cli db:seed:all
    ```

4. **Test your application to ensure the database is working correctly.**

5. **Push your code!**

## Setting Up Database Tests

1. **Set Up a Test Database**

    Modify `config/config.json` to define a separate database for testing:

    ```json
    "test": {
      "dialect": "sqlite",
      "storage": ":memory:"
    }
    ```

    This ensures tests use an in-memory SQLite database that resets between runs.

2. **Writing a Test**

    Write a test file (e.g., `tests/user.test.js`):

    ```js
    const { User } = require('../models');

    test('creates a user', async () => {
      const user = await User.create({ name: 'Test User', email: 'test@example.com' });
      expect(user.name).toBe('Test User');
    });
    ```

    Run tests with:

    ```sh
    npm test
    ```

## Resetting the Database (If Needed)

If your database is out of sync or corrupt, reset it with:

```sh
npx sequelize-cli db:migrate:undo:all && npx sequelize-cli db:migrate
```

## Undoing Migrations

- To revert the last migration:

    ```sh
    npx sequelize-cli db:migrate:undo
    ```

- To revert all migrations:

    ```sh
    npx sequelize-cli db:migrate:undo:all
    ```

## Summary

- **When you pull**: Install dependencies, run migrations, and seed data if needed.
- **Before you push**: Ensure database changes are committed, migrations work, and tests pass.
- **For testing**: Use Jest with an in-memory SQLite database.
- **For troubleshooting**: Reset or undo migrations if needed.
