#!/usr/bin/env bash

# Install MediTanzania

# 1. Install Requirements

echo "Installing required NPM packages..."
yarn
echo "...done"

bash build_ml.sh

# 2. Migrate DB

echo "Generating database..."
sequelize db:migrate
echo "...done"

# 3. Seed DB

echo "Inserting default data into the database..."
sequelize db:seed:all
echo "...done"

# 4. Create Default Admin User

echo "Creating default administrator user"
echo "Name: Administrator"
read -p "Enter Email: " admin_email
read -s -p "Enter Password: " admin_pass_1
read -s -p "Confirm Password: " admin_pass_2

# Confirm password

while [ "$admin_pass_1" != "$admin_pass_2" ]
do
  echo "Those passwords don't match! Try again."
  read -s -p "Enter Password: " admin_pass_1
  read -s -p "Confirm Password: " admin_pass_2
done

# Hash the password using OpenSSL
hashed_password=$(echo -n "$admin_pass_1" | openssl dgst -sha256 | awk '{print $2}')

echo "Hashed Password: $hashed_password"

# Write the user to the database

sqlite3 database.sqlite <<EOF
INSERT INTO Users (name, email, passwordHash, type, createdAt, updatedAt)
VALUES ('Administrator', '$admin_email', '$hashed_password', 'admin', datetime('now'), datetime('now'));
EOF

# 5. Setup Environment
echo "Setting up environment..."
echo "NODE_ENV = DEVELOPMENT" > .env

# create secret key
secret_key=$(openssl rand -base64 32)
echo "SESSION_SECRET=$secret_key" >> .env

echo "..done"
