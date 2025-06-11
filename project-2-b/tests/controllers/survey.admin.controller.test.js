/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../server');
const { User, Survey } = require('../../models');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
require('../setup');

describe('Survey Controller', () => {
  describe('/admin/surveys', () => {
    test('should redirect if not signed in', async () => {
      const response = await request(app)
        .get('/admin/surveys');

      expect(response.statusCode).toBe(302);
    });

    test('should redirect if not admin', async () => {
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
        .get('/admin/surveys')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });

    test('should display if logged in as an admin', async () => {
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
        .get('/admin/surveys')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Survey Management');
    });

    test('should render surveys page with surveys listed', async () => {
      await Survey.create({ name: 'Test Survey A' });
      await Survey.create({ name: 'Test Survey B' });

      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginRes = await request(app).post('/auth/login').send({
        email: 'admin@test.com',
        password: 'testpass123'
      });

      const cookies = loginRes.headers['set-cookie'];

      const response = await request(app)
        .get('/admin/surveys')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Survey Management');
      expect(response.text).toContain('Test Survey A');
      expect(response.text).toContain('Test Survey B');
    });
  });

  describe('POST /admin/surveys/create', () => {
    test('should fail if name or file is missing', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginRes = await request(app).post('/auth/login').send({
        email: 'admin@test.com',
        password: 'testpass123'
      });

      const cookies = loginRes.headers['set-cookie'];

      const response = await request(app)
        .post('/admin/surveys/create')
        .set('Cookie', cookies)
        .field('name', '');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/admin/surveys');
    });
  });

  describe('GET /admin/surveys/:id', () => {
    test('should return 404 if survey does not exist', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginRes = await request(app).post('/auth/login').send({
        email: 'admin@test.com',
        password: 'testpass123'
      });

      const cookies = loginRes.headers['set-cookie'];

      const response = await request(app)
        .get('/admin/surveys/9999')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /admin/surveys/:id/update', () => {
    test('should update survey name', async () => {
      const survey = await Survey.create({ name: 'Old Name' });

      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginRes = await request(app).post('/auth/login').send({
        email: 'admin@test.com',
        password: 'testpass123'
      });

      const cookies = loginRes.headers['set-cookie'];

      const response = await request(app)
        .post(`/admin/surveys/${survey.id}/update`)
        .set('Cookie', cookies)
        .send({ name: 'New Name' });

      expect(response.statusCode).toBe(302);

      const updated = await Survey.findByPk(survey.id);
      expect(updated.name).toBe('New Name');
    });

    test('should redirect if no name provided', async () => {
      const survey = await Survey.create({ name: 'Old Name' });

      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginRes = await request(app).post('/auth/login').send({
        email: 'admin@test.com',
        password: 'testpass123'
      });

      const cookies = loginRes.headers['set-cookie'];

      const response = await request(app)
        .post(`/admin/surveys/${survey.id}/update`)
        .set('Cookie', cookies)
        .send({ name: '' });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(`/admin/surveys/${survey.id}`);
    });
  });
});