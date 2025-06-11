/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../server');
const bcrypt = require('bcrypt');
const path = require('path');
const { User, Survey, Question, QuestionCategory } = require('../../models');
require('../setup');

describe('Admin Responses Controller', () => {
  let cookies;

  beforeAll(async () => {
    const hash = await bcrypt.hash('testpass123', 10);
    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      passwordHash: hash,
      type: 'admin'
    });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'testpass123' });

    cookies = loginResponse.headers['set-cookie'];
  });

  describe('GET /admin/responses', () => {
    test('should redirect if not authenticated', async () => {
      const response = await request(app).get('/admin/responses');
      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should show upload page if authenticated as admin', async () => {
      const response = await request(app)
        .get('/admin/responses')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Upload');
    });
  });

  describe('POST /admin/responses/upload', () => {
    test('should redirect with error if not authenticated', async () => {
      const response = await request(app)
        .post('/admin/responses/upload');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should redirect with error if no survey ID or file', async () => {
      const response = await request(app)
        .post('/admin/responses/upload')
        .set('Cookie', cookies)
        .field('id', ''); // missing id

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/admin/responses');
    });

    test('should redirect with error if survey ID is missing', async () => {
      const response = await request(app)
        .post('/admin/responses/upload')
        .set('Cookie', cookies)
        .attach('csv', path.join(__dirname, '../fixtures/test.csv'));

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/admin/responses');
    });

    test('should redirect with error if file is missing', async () => {
      const survey = await Survey.create({ name: 'Test Survey' });
      const response = await request(app)
        .post('/admin/responses/upload')
        .set('Cookie', cookies)
        .field('id', survey.id.toString());

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/admin/responses');
    });

    test('should redirect with error if registration fails', async () => {
      const survey = await Survey.create({ name: 'Test Survey' });

      // Provide a broken CSV to simulate failure
      const response = await request(app)
        .post('/admin/responses/upload')
        .set('Cookie', cookies)
        .field('id', survey.id.toString())
        .attach('csv', path.join(__dirname, '../fixtures/bad.csv'));

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/admin/responses');
    });

    test('should process upload if valid', async () => {
      const survey = await Survey.create({ name: 'Test Survey' });

      const category = await QuestionCategory.create({ name: 'Test Category' });

      await Question.create({
        surveyId: survey.id,
        text: 'Q1',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      await Question.create({
        surveyId: survey.id,
        text: 'Q2',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      const response = await request(app)
        .post('/admin/responses/upload')
        .set('Cookie', cookies)
        .field('id', survey.id.toString())
        .attach('csv', path.join(__dirname, '../fixtures/test.csv'));

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/admin/responses');
    });
  });
});
