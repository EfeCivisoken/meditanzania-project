const session = require('supertest-session');
const app = require('../../server');
const { sequelize, Facility, Region, District, Ward, Municipality, QuestionCategory } = require('../../models');

describe('Compare Controller', () => {
  let testSession = null;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const region = await Region.create({ name: 'Test Region' });
    const district = await District.create({ name: 'Test District', regionId: region.id });
    const ward = await Ward.create({ name: 'Test Ward', districtId: district.id });
    const municipality = await Municipality.create({ name: 'Test Municipality', wardId: ward.id });
    await QuestionCategory.create({ name: 'General' });
    await Facility.create({
      name: 'Test Facility',
      commonName: 'Test Facility Common',
      type: 'Clinic',
      phoneNumber: '1234567890',
      status: 'active',
      address: '123 Test Street',
      email: 'test@facility.com',
      website: 'http://facility.com',
      longitude: 0.0,
      latitude: 0.0,
      municipalityId: municipality.id
    });
  });

  beforeEach(() => {
    testSession = session(app);
  });

  describe('POST /compare/add', () => {
    test('should return 400 if no facility ID is provided', async () => {
      const res = await testSession.post('/compare/add').send({});
      expect(res.statusCode).toBe(400);
    });

    test('should add facility ID to session compare list', async () => {
      const res = await testSession.post('/compare/add').send({ facility: '1' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.compareList).toContain('1');
    });

    test('should not add duplicate facility IDs', async () => {
      await testSession.post('/compare/add').send({ facility: '1' });
      const res = await testSession.post('/compare/add').send({ facility: '1' });
      expect(res.body.compareList.filter(id => id === '1').length).toBe(1);
    });
  });

  describe('POST /compare/remove', () => {
    test('should return 400 if no facility ID is provided', async () => {
      const res = await testSession.post('/compare/remove').send({});
      expect(res.statusCode).toBe(400);
    });

    test('should remove facility ID from session compare list', async () => {
      await testSession.post('/compare/add').send({ facility: '1' });
      const res = await testSession.post('/compare/remove').send({ facility: '1' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /compare', () => {
    test('should render the compare view with no facilities if list is empty', async () => {
      const res = await testSession.get('/compare');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Compare');
    });
  });
});