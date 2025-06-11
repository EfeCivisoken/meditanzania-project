const request = require('supertest');
const app = require('../../server');
const { sequelize, Facility, Municipality, QuestionCategory, Region, District, Ward } = require('../../models');

describe('Search Controller', () => {
  let region, district, ward, municipality, category;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    region = await Region.create({ name: 'Test Region' });
    district = await District.create({ name: 'Test District', regionId: region.id });
    ward = await Ward.create({ name: 'Test Ward', districtId: district.id });
    municipality = await Municipality.create({ name: 'Test Municipality', wardId: ward.id });
    expect(municipality.id).toBeDefined();
    console.log(municipality.id);
    category = await QuestionCategory.create({ name: 'General' });

    await Facility.create({
      name: 'Alpha Clinic',
      type: 'Clinic',
      municipalityId: municipality.id
    });

    await Facility.create({
      name: 'Beta Hospital',
      type: 'Hospital',
      municipalityId: municipality.id
    });

    await Facility.create({
      name: 'Gamma Center',
      type: 'Clinic',
      municipalityId: municipality.id
    });

    expect(municipality.id).toBeDefined();
  });

  afterAll(async () => {
    await sequelize.sync({ force: true });
    await Facility.destroy({ where: {} });
    await Municipality.destroy({ where: {} });
    await Ward.destroy({ where: {} });
    await District.destroy({ where: {} });
    await Region.destroy({ where: {} });
    await QuestionCategory.destroy({ where: {} });
  });

  test('GET /facilities with no params returns all', async () => {
    const res = await request(app).get('/facilities');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Alpha Clinic');
  });

  test('GET /facilities with name query', async () => {
    const res = await request(app).get('/facilities?name=Alpha');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Alpha Clinic');
  });

  test('GET /facilities with loc and name query', async () => {
    expect(municipality.id).toBeDefined();
    const loc = `m#${municipality.id}`;
    console.log(loc);
    const res = await request(app).get(`/facilities?loc=${encodeURIComponent(loc)}&name=Alpha&category=${category.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Alpha Clinic');
  }, 10000);

  test('GET /facilities with loc only', async () => {
    const res = await request(app).get(`/facilities?loc=m%23${municipality.id}&category=${category.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Alpha Clinic');
  });

  test('GET /facilities with loc only and no category param defaults to category 1', async () => {
    const res = await request(app).get(`/facilities?loc=m%23${municipality.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Alpha Clinic');
  });

  test('GET /facilities with loc only and category sorting works', async () => {
    // Assign scores to facilities for sorting test
    const alpha = await Facility.findOne({ where: { name: 'Alpha Clinic' } });
    const beta = await Facility.findOne({ where: { name: 'Beta Hospital' } });

    const { FacilityScore } = require('../../models');
    await FacilityScore.create({ facilityId: alpha.id, categoryId: category.id, score: 80 });
    await FacilityScore.create({ facilityId: beta.id, categoryId: category.id, score: 90 });

    const res = await request(app).get(`/facilities?loc=m%23${municipality.id}&category=${category.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.text.indexOf('Beta Hospital')).toBeLessThan(res.text.indexOf('Alpha Clinic'));
  });
});