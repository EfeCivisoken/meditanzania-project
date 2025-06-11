/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../server');
const { User, Facility, Municipality } = require('../../models');
const bcrypt = require('bcrypt');
require('../setup');

describe('Facility Controller', () => {
  describe('/admin/facilities', () => {
    test('should redirect if not logged in as admin', async () => {
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
        .get('/admin/facilities')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });

    test('should redirect if not logged in', async () => {
      const response = await request(app)
        .get('/admin/facilities');

      expect(response.statusCode).toBe(302);
    });

    test('should allow admin to create a new facility', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      // simulate login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // test facility creation
      const response = await request(app)
        .post('/admin/facilities/create')
        .set('Cookie', cookies)
        .send({
          name: 'New Facility',
          location: '123 Facility St',
        });

      expect(response.statusCode).toBe(302);
      
      const fac = await Facility.findOne({
        where: {
          name: 'New Facility'
        }
      });

      expect(fac).toBeDefined();
    });

    test('should prevent non-admin users from creating a facility', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test User',
        email: 'user@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      // simulate login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // test facility creation
      const response = await request(app)
        .post('/admin/facilities/create')
        .set('Cookie', cookies)
        .send({
          name: 'Unauthorized Facility',
          location: '456 Unauthorized St',
        });

      expect(response.statusCode).toBe(302);
    });
  });

  describe('/admin/facilities/:id', () => {
    test('should return 404 for non-existent facility', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      // simulate login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // test request for non-existent facility
      const response = await request(app)
        .get('/admin/facilities/9999')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('/admin/facilities/:id/activate', () => {
    test('should activate a facility if admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      // simulate login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
     
      const facility = await Facility.create({
        name: 'Facility to Activate',
        commonName: 'Activate Facility',
        type: 'Healthcare',
        status: 'inactive',
        phoneNumber: '123-456-7890',
        address: '789 Activate St',
        email: 'activate@facility.com',
        website: 'http://activatefacility.com',
        municipalityId: municipality.id
      });

      // activate the facility
      const response = await request(app)
        .get(`/admin/facilities/${facility.id}/activate`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);

      // check that the facility is activated in the database
      const activatedFacility = await Facility.findByPk(facility.id);
      expect(activatedFacility).toBeDefined();
      expect(activatedFacility.status).toBe('active');
    });

    test('should prevent non-admin users from activating a facility', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test User',
        email: 'user@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      // simulate login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // attempt to activate a facility
      const response = await request(app)
        .get('/admin/facilities/1/activate')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });
  });

  describe('/admin/facilities/:id/deactivate', () => {
    test('should deactivate a facility if admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test Admin',
        email: 'admin@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      // simulate login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
     
      const facility = await Facility.create({
        name: 'Facility to Activate',
        commonName: 'Activate Facility',
        type: 'Healthcare',
        status: 'active',
        phoneNumber: '123-456-7890',
        address: '789 Activate St',
        email: 'activate@facility.com',
        website: 'http://activatefacility.com',
        municipalityId: municipality.id
      });

      // activate the facility
      const response = await request(app)
        .get(`/admin/facilities/${facility.id}/deactivate`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);

      // check that the facility is activated in the database
      const activatedFacility = await Facility.findByPk(facility.id);
      expect(activatedFacility).toBeDefined();
      expect(activatedFacility.status).toBe('inactive');
    });

    test('should prevent non-admin users from deactivating a facility', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test User',
        email: 'user@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      // simulate login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // attempt to deactivate a facility
      const response = await request(app)
        .get('/admin/facilities/1/deactivate')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });
  });

  describe('GET /admin/facilities (listFacilities)', () => {
    test('should redirect if not authenticated', async () => {
      const response = await request(app).get('/admin/facilities');
      expect(response.statusCode).toBe(302);
    });

    test('should redirect if authenticated but not admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Non Admin User',
        email: 'nonadmin@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonadmin@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app)
        .get('/admin/facilities')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });

    test('should allow admin to access facilities list', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin2@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin2@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app)
        .get('/admin/facilities')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /admin/facilities/create', () => {
    test('should fail if required fields are missing', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin3@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin3@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // Missing name
      let response = await request(app)
        .post('/admin/facilities/create')
        .set('Cookie', cookies)
        .send({
          location: '123 Facility St',
        });
      expect(response.statusCode).toBe(302);

      // Missing location
      response = await request(app)
        .post('/admin/facilities/create')
        .set('Cookie', cookies)
        .send({
          name: 'Incomplete Facility',
        });
      expect(response.statusCode).toBe(302);
    });
  });

  describe('GET /admin/updatefacilityscores', () => {
    test('should redirect if not authenticated', async () => {
      const response = await request(app).get('/admin/updatefacilityscores');
      expect(response.statusCode).toBe(302);
    });

    test('should redirect if authenticated but not admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Non Admin User',
        email: 'nonadmin2@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonadmin2@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app)
        .get('/admin/updatefacilityscores')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
    });
  });

  describe('POST /admin/facilities/:id/update', () => {
    test('should redirect (302) for invalid or missing data', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin5@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin5@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
     
      const facility = await Facility.create({
        name: 'Facility to Update',
        commonName: 'Update Facility',
        type: 'Healthcare',
        status: 'active',
        phoneNumber: '123-456-7890',
        address: '789 Update St',
        email: 'update@facility.com',
        website: 'http://updatefacility.com',
        municipalityId: municipality.id
      });

      // Missing required fields
      const response = await request(app)
        .post(`/admin/facilities/${facility.id}/update`)
        .set('Cookie', cookies)
        .send({
          name: '',
          address: ''
        });

      expect(response.statusCode).toBe(302);
    });

    test('should redirect if facility not found', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin6@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin6@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const response = await request(app)
        .post('/admin/facilities/9999/update')
        .set('Cookie', cookies)
        .send({
          name: 'Updated Name',
          address: 'Updated Address'
        });

      expect(response.statusCode).toBe(302);
    });

    test('should successfully update facility with valid data', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Admin User',
        email: 'admin7@test.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin7@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
     
      const facility = await Facility.create({
        name: 'Facility to Update',
        commonName: 'Update Facility',
        type: 'Healthcare',
        status: 'active',
        phoneNumber: '123-456-7890',
        address: '789 Update St',
        email: 'update@facility.com',
        website: 'http://updatefacility.com',
        municipalityId: municipality.id
      });

      const response = await request(app)
        .post(`/admin/facilities/${facility.id}/update`)
        .set('Cookie', cookies)
        .send({
          name: 'Updated Facility Name',
          commonName: 'Updated Common Name',
          type: 'Clinic',
          phone: '987-654-3210',
          address: 'Updated Address',
          email: 'updatedemail@facility.com',
          website: 'https://updatedfacility.com',
          location: municipality.id,
          longitude: '10.1234',
          latitude: '-20.5678'
        });

      expect(response.statusCode).toBe(302);

      const updatedFacility = await Facility.findByPk(facility.id);
      expect(updatedFacility.name).toBe('Updated Facility Name');
      expect(updatedFacility.commonName).toBe('Updated Common Name');
      expect(updatedFacility.type).toBe('Clinic');
      expect(updatedFacility.phoneNumber).toBe('987-654-3210');
      expect(updatedFacility.address).toBe('Updated Address');
      expect(updatedFacility.email).toBe('updatedemail@facility.com');
      expect(updatedFacility.website).toBe('https://updatedfacility.com');
      expect(updatedFacility.municipalityId).toBe(municipality.id);
      expect(updatedFacility.longitude).toBe(10.1234);
      expect(updatedFacility.latitude).toBe(-20.5678);
    });
  });
});
