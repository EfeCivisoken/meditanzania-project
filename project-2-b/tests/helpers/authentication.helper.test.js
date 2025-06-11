/* eslint-disable no-undef */
'use strict';
const { sequelize, User } = require('../../models');
const bcrypt = require('bcrypt');
const { authenticationStrategy, serializeUser, deserializeUser } = require('../../helpers/authentication');

describe('Authentication Helper Tests', () => {

  const done = jest.fn();

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  test('should authenticate a user given correct credentials', async () => {

    await User.create({
      email: 'test@user.com',
      name: 'User',
      passwordHash: await bcrypt.hash('testpass234', 10),
      type: 'admin'
    });

    await new Promise((resolve) => {
      authenticationStrategy('test@user.com', 'testpass234', (err, user) => {
        done(err, user);
        resolve();
      });
    });

    expect(done).toHaveBeenCalledWith(null, 
      expect.objectContaining({
        email: 'test@user.com',
        type: 'admin'
      }));

  });

  test('should not authenticate a user given an invalid email', async () => {

    await User.create({
      email: 'test@user.com',
      name: 'User',
      passwordHash: await bcrypt.hash('testpass234', 10),
      type: 'admin'
    });

    await new Promise((resolve) => {
      authenticationStrategy('test12@user.com', 'testpass234', (err, user, message) => {
        done(err, user, message);
        resolve();
      });
    });

    expect(done).toHaveBeenCalledWith(null, false, expect.objectContaining({ message: 'Invalid email.' }));

  });

  test('should not authenticate a user given a valid email but a non-matching password', async () => {

    await User.create({
      email: 'test@user.com',
      name: 'User',
      passwordHash: await bcrypt.hash('testpass234', 10),
      type: 'admin'
    });

    await new Promise((resolve) => {
      authenticationStrategy('test@user.com', 'testpass567', (err, user, message) => {
        done(err, user, message);
        resolve();
      });
    });

    expect(done).toHaveBeenCalledWith(null, false, expect.objectContaining({ message: 'Invalid password.' }));

  });

  test('users should be serialized to their ids', async () => {
    const user1 = await User.create({
      name: 'User 1',
      email: 'test1@user.com',
      passwordHash: await bcrypt.hash('testpass234', 10),
      type: 'admin'
    });

    const user2 = await User.create({
      name: 'User 2',
      email: 'test2@user.com',
      passwordHash: await bcrypt.hash('testpass234', 10),
      type: 'admin'
    });

    const user3 = await User.create({
      name: 'User 3',
      email: 'test3@user.com',
      passwordHash: await bcrypt.hash('testpass234', 10),
      type: 'admin'
    });

    serializeUser(user1, done);
    expect(done).toHaveBeenCalledWith(null, user1.id);
    
    serializeUser(user2, done);
    expect(done).toHaveBeenCalledWith(null, user2.id);

    serializeUser(user3, done);
    expect(done).toHaveBeenCalledWith(null, user3.id);

  });

  test('user ids should deserialize into their user objects', async () => {

    const testPass = await bcrypt.hash('testpass234', 10);

    const user1 = await User.create({
      name: 'User 1',
      email: 'test1@user.com',
      passwordHash: testPass,
      type: 'admin'
    });

    const user2 = await User.create({
      name: 'User 2',
      email: 'test2@user.com',
      passwordHash: testPass,
      type: 'admin'
    });

    const user3 = await User.create({
      name: 'User 3',
      email: 'test3@user.com',
      passwordHash: testPass,
      type: 'admin'
    });

    await deserializeUser(user1.id, done);
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
      email: 'test1@user.com',
      name: 'User 1',
      passwordHash: testPass,
      type: 'admin'
    }));
    
    await deserializeUser(user2.id, done);
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
      email: 'test2@user.com',
      name: 'User 2',
      passwordHash: testPass,
      type: 'admin'
    }));

    await deserializeUser(user3.id, done);
    expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
      email: 'test3@user.com',
      name: 'User 3',
      passwordHash: testPass,
      type: 'admin'
    }));

  });
});