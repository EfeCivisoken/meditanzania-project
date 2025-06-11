const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../server');
const { sequelize, User, Facility, FacilityScore, Municipality, Region, District, Ward, QuestionCategory, UserJurisdiction } = require('../../models');

describe('Index Controller', () => {
  let server;
  let agent;
  let staffUser, govUser, pubUser, facility, staffAgent, govAgent, pubAgent;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const region = await Region.create({ name: 'Test Region' });
    const district = await District.create({ name: 'Test District', regionId: region.id });
    const ward = await Ward.create({ name: 'Test Ward', districtId: district.id });
    const municipality = await Municipality.create({ name: 'Test Municipality', wardId: ward.id });

    await QuestionCategory.create({ name: 'Overall' });

    const facility = await Facility.create({
      name: 'Test Facility',
      latitude: 0,
      longitude: 0,
      municipalityId: municipality.id
    });

    await FacilityScore.create({
      facilityId: facility.id,
      categoryId: 1,
      score: 4.5
    });

    await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      passwordHash: 'hashedpassword',
      type: 'admin'
    });

    server = app.listen(4000);
    agent = request.agent(server);
    
    const passwordHash = await bcrypt.hash('pass123', 10);

    staffUser = await User.create({
      name: 'Staff',
      email: 'staff@test.com',
      passwordHash,
      type: 'facility-staff',
      worksAt: facility.id
    });

    govUser = await User.create({
      name: 'Gov',
      email: 'gov@test.com',
      passwordHash,
      type: 'government-official'
    });

    pubUser = await User.create({
      name: 'Pub',
      email: 'pub@test.com',
      passwordHash,
      type: 'public-official'
    });

    // login helpers
    const loginAs = async (email, password) => {
      const agent = request.agent(app);
      await agent
        .post('/auth/login')
        .type('form')
        .send({ email, password });
      return agent;
    };

    staffAgent = await loginAs('staff@test.com', 'pass123');
    govAgent = await loginAs('gov@test.com', 'pass123');
    pubAgent = await loginAs('pub@test.com', 'pass123');
  });

  afterAll(async () => {
    await server.close();
    await sequelize.close();
  });

  test('should render the index view for unauthenticated users', async () => {
    const res = await agent.get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Test Facility');
  });

  test('should render index view for authenticated staff with valid facility', async () => {
    const res = await staffAgent.get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Facility Staff Dashboard');
  });

  test('should fallback to citizen view for government official with no jurisdiction', async () => {
    const res = await govAgent.get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Welcome to MediTanzania');
  });

  test('should fallback to citizen view for public official', async () => {
    const res = await pubAgent.get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Welcome to MediTanzania');
  });

  test('should render index for gov official with region jurisdiction', async () => {
    const region = await Region.create({ name: 'Region X' });
    const district = await District.create({ name: 'District X', regionId: region.id });
    const ward = await Ward.create({ name: 'Ward X', districtId: district.id });
    const municipality = await Municipality.create({ name: 'Municipality X', wardId: ward.id });

    const govFacility = await Facility.create({
      name: 'Gov Facility',
      latitude: 1,
      longitude: 1,
      municipalityId: municipality.id
    });

    const govUserWithJurisdiction = await User.create({
      name: 'Gov Region',
      email: 'govregion@test.com',
      passwordHash: await bcrypt.hash('pass123', 10),
      type: 'government-official'
    });

    await UserJurisdiction.create({
      userId: govUserWithJurisdiction.id,
      regionId: region.id
    });

    const govRegionAgent = request.agent(app);
    await govRegionAgent
      .post('/auth/login')
      .type('form')
      .send({ email: 'govregion@test.com', password: 'pass123' });

    const res = await govRegionAgent.get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Gov Facility');
  }, 40000);

  test('should render the about page', async () => {
    const res = await agent.get('/about');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('about');
  });
});