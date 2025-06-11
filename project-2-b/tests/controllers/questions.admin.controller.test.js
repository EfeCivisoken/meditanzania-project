/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../server');
const bcrypt = require('bcrypt');
const { User, Question, QuestionCategory, Survey } = require('../../models');
require('../setup');

describe('Survey Questions Controller', () => {
  let adminCookies;

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
      .send({
        email: 'admin@test.com',
        password: 'testpass123'
      });

    adminCookies = loginResponse.headers['set-cookie'];
  });

  describe('GET /admin/surveys/questions/:id' ,() => {
    test('should redirect if not signed in', async () => {
      const response = await request(app).get('/admin/surveys/questions/1');
      expect(response.statusCode).toBe(302);
    });

    test('should redirect if not admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Not Admin',
        email: 'notadmin@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'notadmin@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .get('/admin/surveys/questions/1')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });

    test('should 404 if question not found', async () => {
      const response = await request(app)
        .get('/admin/surveys/questions/9999')
        .set('Cookie', adminCookies);

      expect(response.statusCode).toBe(404);
    });

    test('should render question view if found', async () => {
      const survey = await Survey.create({ name: 'Test Survey' });
      const category = await QuestionCategory.create({ name: 'Test Category' });

      const question = await Question.create({
        surveyId: survey.id,
        text: 'Test question',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      const response = await request(app)
        .get(`/admin/surveys/questions/${question.id}`)
        .set('Cookie', adminCookies);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Test question');
    });
  });

  describe('POST /admin/surveys/question/:id/update', () => {
    test('should redirect if not signed in', async () => {

      const survey = await Survey.create({ name: 'Test Survey' });
      const category = await QuestionCategory.create({ name: 'Test Category' });
      
      const question = await Question.create({
        surveyId: survey.id,
        text: 'Test question',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      const response = await request(app)
        .post(`/admin/surveys/questions/${question.id}/update`)
        .send({});
      expect(response.statusCode).toBe(302);
    });

    test('should redirect if not admin', async () => {
      const survey = await Survey.create({ name: 'Test Survey' });
      const category = await QuestionCategory.create({ name: 'Test Category' });
      const question = await Question.create({
        surveyId: survey.id,
        text: 'Test question',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Not Admin',
        email: 'notadmin2@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'notadmin2@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post(`/admin/surveys/questions/${question.id}/update`)
        .set('Cookie', cookies)
        .send({
          text: 'Should not update',
          weight: 1,
          transformation: 'none',
          category: category.id
        });

      expect(response.statusCode).toBe(302);
    });

    test('should return 404 if question does not exist', async () => {
      const response = await request(app)
        .post('/admin/surveys/questions/99999/update')
        .set('Cookie', adminCookies)
        .send({
          text: 'Nonexistent question',
          weight: 1,
          transformation: 'none',
          category: 1
        });

      expect(response.statusCode).toBe(404);
      expect(response.text).toContain('Question not found');
    });

    test('should 404 if question not found', async () => {
      const response = await request(app)
        .post('/admin/surveys/question/9999/update')
        .set('Cookie', adminCookies)
        .send({
          text: 'Updated',
          weight: 1,
          transformation: 'none',
          category: 1
        });
      expect(response.statusCode).toBe(404);
    });

    test('should redirect if missing required fields', async () => {
      const survey = await Survey.create({ name: 'Missing Fields Survey' });
      const category = await QuestionCategory.create({ name: 'Category X' });
      const question = await Question.create({
        surveyId: survey.id,
        text: 'Some question',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      const response = await request(app)
        .post(`/admin/surveys/questions/${question.id}/update`)
        .set('Cookie', adminCookies)
        .send({ text: '', weight: '', transformation: '', category: '' });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(`/admin/surveys/questions/${question.id}`);
    });

    test('should redirect if category id is invalid', async () => {
      const survey = await Survey.create({ name: 'Invalid Category Survey' });
      const category = await QuestionCategory.create({ name: 'Valid Cat' });
      const question = await Question.create({
        surveyId: survey.id,
        text: 'Another question',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      const response = await request(app)
        .post(`/admin/surveys/questions/${question.id}/update`)
        .set('Cookie', adminCookies)
        .send({
          text: 'Updated',
          weight: 2,
          transformation: 'none',
          category: 9999
        });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(`/admin/surveys/questions/${question.id}`);
    });

    test('should update question if valid data', async () => {
      const survey = await Survey.create({ name: 'Test Survey 2' });
      const category = await QuestionCategory.create({ name: 'Valid Category' });
      const question = await Question.create({
        surveyId: survey.id,
        text: 'Old question',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      const response = await request(app)
        .post(`/admin/surveys/questions/${question.id}/update`)
        .set('Cookie', adminCookies)
        .send({
          text: 'Updated question',
          weight: 2,
          transformation: 'sqrt',
          category: category.id
        });

      expect(response.statusCode).toBe(302);
      const updated = await Question.findByPk(question.id);
      expect(updated.text).toBe('Updated question');
      expect(updated.weight).toBe(2);
      expect(updated.transformation).toBe('sqrt');
    });
  });

  describe('POST /admin/surveys/questions/categories/create', () => {
    test('should redirect if not signed in', async () => {
      const response = await request(app)
        .post('/admin/surveys/questions/categories/create')
        .send({ name: 'New Category' });
      expect(response.statusCode).toBe(302);
    });

    test('should redirect if not admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Not Admin',
        email: 'notadmin3@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'notadmin3@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post('/admin/surveys/questions/categories/create')
        .set('Cookie', cookies)
        .send({ name: 'Should Not Create' });

      expect(response.statusCode).toBe(302);
    });

    test('should create new category if valid', async () => {
      const response = await request(app)
        .post('/admin/surveys/questions/categories/create')
        .set('Cookie', adminCookies)
        .send({ name: 'New Valid Category' });
      expect(response.statusCode).toBe(302);

      const found = await QuestionCategory.findOne({ where: { name: 'New Valid Category' } });
      expect(found).not.toBeNull();
    });

    test('should reject if name missing', async () => {
      const response = await request(app)
        .post('/admin/surveys/questions/categories/create')
        .set('Cookie', adminCookies)
        .send({ name: '' });
      expect(response.statusCode).toBe(302);
    });
  });
});