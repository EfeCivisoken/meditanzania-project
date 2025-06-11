/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../server');
const bcrypt = require('bcrypt');
const { User } = require('../../models');
require('../setup');

describe('Locations Controller', () => {

  describe('/admin/locations', () => {

    test('should redirect if not signed in', async () => {
      const response = await request(app)
        .get('/admin/locations');

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
        .get('/admin/locations')
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
        .get('/admin/locations')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Locations');
    });

  });

  describe('/admin/locations/:type/:id/update', () => {
    let cookies;
    let testRegion;

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

      testRegion = await require('../../models').Region.create({ name: 'Test Region' });
    });

    test('should update a region', async () => {
      const response = await request(app)
        .post(`/admin/locations/regions/${testRegion.id}/update`)
        .set('Cookie', cookies)
        .send({ name: 'Updated Region' });

      expect(response.statusCode).toBe(302);

      const updated = await require('../../models').Region.findByPk(testRegion.id);
      expect(updated.name).toBe('Updated Region');
    });

    test('should flash error for invalid id', async () => {
      const response = await request(app)
        .post(`/admin/locations/regions/999999/update`)
        .set('Cookie', cookies)
        .send({ name: 'Does not exist' });

      expect(response.statusCode).toBe(302);
    });

    test('should flash error for missing name', async () => {
      const response = await request(app)
        .post(`/admin/locations/regions/${testRegion.id}/update`)
        .set('Cookie', cookies)
        .send({ name: '' });

      expect(response.statusCode).toBe(302);
    });
  });

  describe('/admin/locations/:type/create', () => {
    let cookies;

    beforeAll(async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin Create',
        email: 'create@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'create@test.com', password: 'testpass123' });

      cookies = loginResponse.headers['set-cookie'];
    });
    
    test('should redirect if not authenticated', async () => {
      const response = await request(app)
        .post('/admin/locations/regions/create');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should redirect if not admin', async () => {
      const bcrypt = require('bcrypt');
      const { User } = require('../../models');
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Government Official',
        email: 'gov@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'gov@test.com', password: 'testpass123' });

      const govCookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post('/admin/locations/regions/create')
        .set('Cookie', govCookies)
        .send({ name: 'Should Not Create' });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should flash error on invalid location type', async () => {
      const response = await request(app)
        .post('/admin/locations/invalidtype/create')
        .set('Cookie', cookies)
        .send({ name: 'Bad Type' });

      expect(response.statusCode).toBe(404);
    });

    test('should create a region', async () => {
      const response = await request(app)
        .post('/admin/locations/regions/create')
        .set('Cookie', cookies)
        .send({ name: 'Created Region' });

      expect(response.statusCode).toBe(302);

      const region = await require('../../models').Region.findOne({ where: { name: 'Created Region' } });
      expect(region).toBeDefined();
    });

    test('should flash error for missing name', async () => {
      const response = await request(app)
        .post('/admin/locations/regions/create')
        .set('Cookie', cookies)
        .send({ name: '' });

      expect(response.statusCode).toBe(302);
    });
  });

  describe('/admin/locations/:type/:id/delete', () => {
    let cookies;
    let regionToDelete;

    beforeAll(async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin Delete',
        email: 'delete@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'delete@test.com', password: 'testpass123' });

      cookies = loginResponse.headers['set-cookie'];

      regionToDelete = await require('../../models').Region.create({ name: 'Delete Me' });
    });

    test('should delete a region', async () => {
      const response = await request(app)
        .get(`/admin/locations/regions/${regionToDelete.id}/delete`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);

      const deleted = await require('../../models').Region.findByPk(regionToDelete.id);
      expect(deleted).toBeNull();
    });

    test('should flash error if region not found', async () => {
      const response = await request(app)
        .get(`/admin/locations/regions/999999/delete`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });
  });

});

describe('/admin/updatefacilityscores', () => {
  let cookies, facility;

  beforeAll(async () => {
    const { User, Facility, Municipality, Survey, Question, QuestionCategory, SurveyResponse, QuestionResponse } = require('../../models');
    const bcrypt = require('bcrypt');

    const hash = await bcrypt.hash('testpass123', 10);
    await User.create({
      name: 'Admin Score',
      email: 'score@test.com',
      passwordHash: hash,
      type: 'admin'
    });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'score@test.com', password: 'testpass123' });

    cookies = loginResponse.headers['set-cookie'];

    const municipality = await Municipality.create({ name: 'Test Municipality' });
    facility = await Facility.create({
      name: 'Test Facility',
      commonName: 'Test Common',
      type: 'hospital',
      phoneNumber: '123456789',
      address: '123 Main',
      email: 'test@facility.com',
      website: 'https://example.com',
      status: 'active',
      municipalityId: municipality.id,
      longitude: 0,
      latitude: 0
    });

    const survey = await Survey.create({ name: 'Survey' });
    const category = await QuestionCategory.create({ name: 'Category' });
    const question = await Question.create({
      text: 'Question 1',
      textResponse: false,
      weight: 1,
      transformation: 'none',
      categoryId: category.id,
      surveyId: survey.id
    });

    const response = await SurveyResponse.create({ facilityId: facility.id, surveyId: survey.id });
    await QuestionResponse.create({ surveyResponseId: response.id, questionId: question.id, value: 5 });
  });

  test('should update facility scores and redirect', async () => {
    const response = await request(app)
      .get('/admin/updatefacilityscores')
      .set('Cookie', cookies);

    expect(response.statusCode).toBe(302);

    const { FacilityScore } = require('../../models');
    const scores = await FacilityScore.findAll({ where: { facilityId: facility.id } });

    expect(scores.length).toBeGreaterThan(0);
  });
});

describe('/admin/facilities/:id', () => {
  let cookies, facility;

  beforeAll(async () => {
    const { User, Facility, Municipality } = require('../../models');
    const bcrypt = require('bcrypt');

    const hash = await bcrypt.hash('testpass123', 10);
    await User.create({
      name: 'Admin View',
      email: 'view@test.com',
      passwordHash: hash,
      type: 'admin'
    });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'view@test.com', password: 'testpass123' });

    cookies = loginResponse.headers['set-cookie'];

    const municipality = await Municipality.create({ name: 'View Municipality' });
    facility = await Facility.create({
      name: 'View Facility',
      commonName: 'Common View',
      type: 'clinic',
      phoneNumber: '987654321',
      address: '321 Lane',
      email: 'view@facility.com',
      website: 'https://view.com',
      status: 'active',
      municipalityId: municipality.id,
      longitude: 0,
      latitude: 0
    });
  });

  test('should render facility view', async () => {
    const response = await request(app)
      .get(`/admin/facilities/${facility.id}`)
      .set('Cookie', cookies);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Facility');
  });

  test('should 404 on non-existent facility', async () => {
    const response = await request(app)
      .get(`/admin/facilities/999999`)
      .set('Cookie', cookies);

    expect(response.statusCode).toBe(404);
  });
});