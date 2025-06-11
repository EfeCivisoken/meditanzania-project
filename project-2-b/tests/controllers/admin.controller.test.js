/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../server');
const {User} = require('../../models');
const bcrypt = require('bcrypt');
require('../setup');

describe('Admin Controller', () => {
  describe('/admin', () => {
    test('should redirect if not logged in as admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test User',
        email: 'test@test.com',
        passwordHash: hash,
        type: 'government-official'
      });
  
      // simulate login
  
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com',
          password: 'testpass123'
        });
  
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // test actual request
  
      const response = await request(app)
        .get('/admin')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });

    test('should redirect if not logged in', async () => {
      const response = await request(app)
        .get('/admin');

      expect(response.statusCode).toBe(302);
    });

    test('should redirect if not logged in as admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test User 2',
        email: 'test2@test.com',
        passwordHash: hash,
        type: 'admin'
      });
  
      // simulate login
  
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test2@test.com',
          password: 'testpass123'
        });
  
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // test actual request
  
      const response = await request(app)
        .get('/admin')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Administration Panel');
    });

  });
});