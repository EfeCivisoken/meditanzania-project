const request = require('supertest');
const app = require('../../server');
const { User, UserJurisdiction, Region, Facility, FacilityScore, District, Ward, Municipality, QuestionCategory } = require('../../models');

jest.mock('../../helpers/score', () => ({
  topNlowNByCatByJur: jest.fn()
}));

describe('TopNLowN Controller', () => {
  let agent;

  beforeAll(async () => {
    const { sequelize } = require('../../models');
    const bcrypt = require('bcrypt');
    await sequelize.sync({ force: true });

    // Setup sample data
    const r = await Region.create({ name: 'Test Region' });
    const d = await District.create({ name: 'Test District', regionId: r.id });
    const w = await Ward.create({ name: 'Test Ward', districtId: d.id });
    const m = await Municipality.create({ name: 'Test Municipality', wardId: w.id });
    const c = await QuestionCategory.create({ name: 'General' });

    await Facility.create({
      id: 1,
      name: 'Test Facility',
      municipalityId: m.id,
    });

    await FacilityScore.create({
      facilityId: 1,
      score: 4.5,
      categoryId: c.id
    });

    const hashedPassword = await bcrypt.hash('test', 10);

    const user = await User.create({
      email: 'gov@test.com',
      name: 'Gov Official',
      passwordHash: hashedPassword,
      type: 'government-official',
    });

    await UserJurisdiction.create({
      userId: user.id,
      regionId: r.id
    });

    const { topNlowNByCatByJur } = require('../../helpers/score');
    topNlowNByCatByJur.mockResolvedValue({
      topN: [{
        id: 1,
        name: 'Top Facility',
        score: 5.0,
        type: 'Hospital',
        location: { name: 'Test Municipality' },
      }],
      lowN: [{
        id: 2,
        name: 'Low Facility',
        score: 1.0,
        type: 'Clinic',
        location: { name: 'Test Municipality' },
      }]
    });

    agent = request.agent(app);

    // Mock login
    await agent.post('/auth/login').send({ email: 'gov@test.com', password: 'test' });
  });

  afterAll(async () => {
    await FacilityScore.destroy({ where: {} });
    await Facility.destroy({ where: {} });
    await UserJurisdiction.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Municipality.destroy({ where: {} });
    await Ward.destroy({ where: {} });
    await District.destroy({ where: {} });
    await Region.destroy({ where: {} });
    await QuestionCategory.destroy({ where: {} });
  });

  test('GET /topnlown/setup redirects correctly for gov official', async () => {
    const res = await agent.get('/topnlown/setup');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toMatch(/^\/topnlown\?jur=r#1&catid=1&n=5$/);
  });

  test('GET /topnlown renders with correct data', async () => {
    const res = await agent.get('/topnlown?jur=r#1&catid=1&n=5');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Test Region');
  }, 10000);
});