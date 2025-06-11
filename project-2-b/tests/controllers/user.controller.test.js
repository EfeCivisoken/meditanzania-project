

const request = require('supertest');
const app = require('../../server');
const { User, sequelize } = require('../../models');
const bcrypt = require('bcrypt');

describe('User Controller', () => {
  let agent;
  let user;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const password = bcrypt.hashSync('oldpassword', 10);
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: password,
      type: 'admin'
    });

    agent = request.agent(app);

    // Log in the user
    await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'oldpassword' });
  });

  afterAll(async () => {
    await sequelize.sync({ force: true });
    await User.destroy({ where: {} });
  });

  test('GET /user/updatepass shows form if authenticated', async () => {
    const res = await agent.get('/user/updatepass');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Update Password');
  });

  test('POST /user/updatepass updates password with correct credentials', async () => {
    const res = await agent
      .post('/user/updatepass')
      .send({ old: 'oldpassword', new: 'newpassword' });
    
    expect(res.header['location']).toBe('/auth/logout');

    // Confirm password updated
    await user.reload();
    expect(bcrypt.compareSync('newpassword', user.passwordHash)).toBe(true);
  });

  test('POST /user/updatepass fails with wrong old password', async () => {
    const res = await agent
      .post('/user/updatepass')
      .send({ old: 'wrongpassword', new: 'something' });

    expect(res.header['location']).toBe('/user/updatepass');
  });

  test('POST /user/updatepass fails with missing fields', async () => {
    const res = await agent
      .post('/user/updatepass')
      .send({ old: '', new: '' });

    expect(res.header['location']).toBe('/user/updatepass');
  });
});