const bcrypt = require('bcrypt');
const session = require('supertest-session');
const request = require('supertest');
const app = require('../../server');
const { sequelize, Facility, Municipality, User, Post } = require('../../models');

describe('Facility Controller', () => {
  let testFacility, testMunicipality, testUser;
  let testSession;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    testMunicipality = await Municipality.create({ name: 'Test Municipality' });
    testFacility = await Facility.create({
      name: 'Test Facility',
      municipalityId: testMunicipality.id
    });

    const { QuestionCategory } = require('../../models');

    await QuestionCategory.bulkCreate([
      { id: 1, name: 'Overall' },
      { id: 2, name: 'Cleanliness' }
    ]);

    const { FacilityScore } = require('../../models');
    await FacilityScore.create({
      facilityId: testFacility.id,
      categoryId: 1,
      score: 3.5
    });
    await FacilityScore.create({
      facilityId: testFacility.id,
      categoryId: 2,
      score: 4.2
    });
    await FacilityScore.create({
      facilityId: testFacility.id,
      categoryId: 1,
      score: 4.1
    });
    await FacilityScore.create({
      facilityId: testFacility.id,
      categoryId: 2,
      score: 4.5
    });
    await FacilityScore.create({
      facilityId: testFacility.id,
      categoryId: 1,
      score: 3.9
    });
    await FacilityScore.create({
      facilityId: testFacility.id,
      categoryId: 2,
      score: 4.0
    });

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      name: 'Staff User',
      email: 'staff@example.com',
      type: 'facility-staff',
      passwordHash: hashedPassword,
      worksAt: testFacility.id
    });

    const tempSession = session(app);
    await tempSession
      .post('/auth/login')
      .send({ email: 'staff@example.com', password: 'password123' });

    testSession = tempSession;
  });

  describe('GET /facilities/:id/citizen', () => {
    test('should render citizen view for existing facility', async () => {
      const res = await request(app).get(`/facilities/${testFacility.id}/citizen`);
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Test Facility');
    });

    test('should return 404 for non-existent facility', async () => {
      const res = await request(app).get('/facilities/9999/citizen');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /facilities/:id/staff', () => {
    test('should redirect unauthenticated user', async () => {
      const res = await request(app).get(`/facilities/${testFacility.id}/staff`);
      expect(res.statusCode).toBe(302);
      expect(res.header.location).toBe('/auth/login');
    });

    test('should allow access to staff view when logged in as staff', async () => {
      const res = await testSession.get(`/facilities/${testFacility.id}/staff`);
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Test Facility');
    });

    test('should redirect non-staff user to login and flash error', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const nonStaff = await User.create({
        name: 'Non Staff',
        email: 'nonstaff@example.com',
        type: 'public-official',
        passwordHash: hashedPassword
      });

      const nonStaffSession = session(app);
      await nonStaffSession
        .post('/auth/login')
        .send({ email: 'nonstaff@example.com', password: 'password123' });

      const res = await nonStaffSession.get(`/facilities/${testFacility.id}/staff`);
      expect(res.statusCode).toBe(302);
      expect(res.header.location).toBe('/auth/login');
    });

    test('should redirect staff to citizen view if they work at a different facility', async () => {
      const otherFacility = await Facility.create({
        name: 'Other Facility',
        municipalityId: testMunicipality.id
      });

      const hashedPassword = await bcrypt.hash('password123', 10);
      const wrongStaff = await User.create({
        name: 'Wrong Staff',
        email: 'otherstaff@example.com',
        type: 'facility-staff',
        passwordHash: hashedPassword,
        worksAt: otherFacility.id
      });

      const wrongStaffSession = session(app);
      await wrongStaffSession
        .post('/auth/login')
        .send({ email: 'otherstaff@example.com', password: 'password123' });

      const res = await wrongStaffSession.get(`/facilities/${testFacility.id}/staff`);
      expect(res.statusCode).toBe(302);
      expect(res.header.location).toBe(`/facilities/${testFacility.id}/citizen`);
    });

    test('should return 404 if facility does not exist (staff view)', async () => {
      const otherFacility = await Facility.create({
        name: 'Other Facility',
        municipalityId: testMunicipality.id
      });

      const hashedPassword = await bcrypt.hash('password123', 10);
      const staffUser = await User.create({
        name: 'Other Staff',
        email: 'otherstaff@example.com',
        type: 'facility-staff',
        passwordHash: hashedPassword,
        worksAt: otherFacility.id
      });

      const staffSession = session(app);
      await staffSession
        .post('/auth/login')
        .send({ email: 'otherstaff@example.com', password: 'password123' });

      const res = await staffSession.get('/facilities/9999/staff');
      expect(res.statusCode).toBe(404);
      expect(res.text).toContain('Facility not found.');
    });
  });

  describe('POST /facilityView/:id/post', () => {
    test('should fail when unauthenticated', async () => {
      const res = await request(app)
        .post(`/facilityView/${testFacility.id}/post`)
        .send({ content: 'Test update' });

      expect(res.statusCode).toBe(403);
    });

    test('should reject if user is not a facility-staff', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const publicUser = await User.create({
        name: 'Public User',
        email: 'public@example.com',
        type: 'public-official',
        passwordHash: hashedPassword
      });

      const publicSession = session(app);
      await publicSession
        .post('/auth/login')
        .send({ email: 'public@example.com', password: 'password123' });

      const res = await publicSession
        .post(`/facilityView/${testFacility.id}/post`)
        .send({ content: 'Public user post' });

      expect(res.statusCode).toBe(403);
      expect(res.text).toContain('Access denied. Only staff members can post updates.');
    });

    test('should allow staff to post an update', async () => {
      const res = await testSession
        .post(`/facilityView/${testFacility.id}/post`)
        .send({ content: 'Staff update post' });

      expect(res.statusCode).toBe(302);
      expect(res.header.location).toBe(`/facilities/${testFacility.id}/staff`);
    });

    test('should reject empty post content', async () => {
      const res = await testSession
        .post(`/facilityView/${testFacility.id}/post`)
        .send({ content: '   ' });

      expect(res.statusCode).toBe(400);
      expect(res.text).toContain('Content is required.');
    });

    test('should reject if staff works at different facility', async () => {
      const otherFacility = await Facility.create({
        name: 'Other Facility',
        municipalityId: testMunicipality.id
      });

      const hashedPassword = await bcrypt.hash('password123', 10);
      const wrongStaff = await User.create({
        name: 'Wrong Staff',
        email: 'wrongstaff@example.com',
        type: 'facility-staff',
        passwordHash: hashedPassword,
        worksAt: otherFacility.id
      });

      const wrongSession = session(app);
      await wrongSession
        .post('/auth/login')
        .send({ email: 'wrongstaff@example.com', password: 'password123' });

      const res = await wrongSession
        .post(`/facilityView/${testFacility.id}/post`)
        .send({ content: 'Wrong update' });

      expect(res.statusCode).toBe(403);
      expect(res.text).toContain('Access denied. You do not work at this facility.');
    });
  });

  describe('GET /facilities/:id (conditionalFacilityView)', () => {
    test('should redirect unauthenticated users to citizen view', async () => {
      const res = await request(app).get(`/facilities/${testFacility.id}`);
      expect(res.statusCode).toBe(302);
      expect(res.header.location).toBe(`/facilities/${testFacility.id}/citizen`);
    });

    test('should redirect facility-staff users to staff view', async () => {
      const res = await testSession.get(`/facilities/${testFacility.id}`);
      expect(res.statusCode).toBe(302);
      expect(res.header.location).toBe(`/facilities/${testFacility.id}/staff`);
    });

    test('should redirect other authenticated users to citizen view', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const govUser = await User.create({
        name: 'Gov Official',
        email: 'gov@example.com',
        type: 'government-official',
        passwordHash: hashedPassword
      });

      const govSession = session(app);
      await govSession
        .post('/auth/login')
        .send({ email: 'gov@example.com', password: 'password123' });

      const res = await govSession.get(`/facilities/${testFacility.id}`);
      expect(res.statusCode).toBe(302);
      expect(res.header.location).toBe(`/facilities/${testFacility.id}/citizen`);
    });
  });
});
