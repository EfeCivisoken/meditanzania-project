const request = require('supertest');
const app = require('../../server');
const { sequelize, Region, District, Ward, Municipality, QuestionCategory } = require('../../models');

describe('Authentication Controller', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Seed basic data
    await Region.create({ name: 'Region A' });
    await District.create({ name: 'District A', regionId: 1 });
    await Ward.create({ name: 'Ward A', districtId: 1 });
    await Municipality.create({ name: 'Municipality A', wardId: 1 });
    await QuestionCategory.create({ name: 'Category A' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /auth/login', () => {
    test('should render login page with required data', async () => {
      const res = await request(app).get('/auth/login');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('auth/login'); // crude check; can be improved with mockRender
    });
  });

  describe('GET /auth/logout', () => {
    test('should logout and redirect to home', async () => {
      const res = await request(app).get('/auth/logout');
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/');
    });
  });
});
