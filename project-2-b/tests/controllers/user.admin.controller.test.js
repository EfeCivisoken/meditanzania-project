/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../../server');
const {User, Municipality, UserJurisdiction} = require('../../models');
const bcrypt = require('bcrypt');
require('../setup');

describe('User Controller', () => {
  describe('/admin/users', () => {
    test('should show view if logged in as admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test User',
        email: 'test@test.com',
        passwordHash: hash,
        type: 'admin'
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
        .get('/admin/users')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain('Users');
    });

    test('should redirect to login page if not logged in', async () => {
  
      const response = await request(app)
        .get('/admin/users');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should redirect to / if logged in as non-admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      await User.create({
        name: 'Test User 2',
        email: 'test2@test.com',
        passwordHash: hash,
        type: 'government-official'
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
        .get('/admin/users')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');
    });
  });

  describe('/admin/users/create', () => {
    test('should work & redirect if logged in as admin', async () => {
  
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
        .post('/admin/users/create')
        .send({
          name: 'name',
          email: 'email',
          password: 'pass',
          type: 'facility-staff'
        })
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);

      const user = await User.findOne({
        where: {
          name: 'name',
          email: 'email',
          type: 'facility-staff'
        }
      });

      console.log(user);

      expect(user).not.toBeNull();
      if (user) {
        await user.destroy();
      }

    });

    test('should redirect to login page if not logged in', async () => {
  
      const response = await request(app)
        .get('/admin/users/create');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should redirect to / if logged in as non-admin', async () => {

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
        .get('/admin/users/create')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');
    });

    test('should handle missing required fields gracefully', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'testpass123' });

      const cookies = loginResponse.headers['set-cookie'];
      const response = await request(app)
        .post('/admin/users/create')
        .send({ name: '', email: '', password: '', type: '' })
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/admin/users');
    });
  });

  describe('/admin/users/:id', () => {
    test('should load for valid ID', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Test User 3',
        email: 'test3@test.com',
        passwordHash: hash,
        type: 'admin'
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
        .get(`/admin/users/${user.id}`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain(user.name);
      expect(response.text).toContain(user.email);

      await user.destroy();
    });
    test('should return 404 for invalid ID', async () => {
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
        .get('/admin/users/99999')
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(404);
    });

    test('should redirect to login page if not logged in when accessing user by ID', async () => {
      const response = await request(app)
        .get('/admin/users/1');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should redirect to / if logged in as non-admin when accessing user by ID', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Test User 4',
        email: 'test4@test.com',
        passwordHash: hash,
        type: 'government-official'
      });

      // simulate login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'test4@test.com',
          password: 'testpass123'
        });

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // test actual request
      const response = await request(app)
        .get(`/admin/users/${user.id}`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');

      await user.destroy();
    });
  });

  describe('/admin/users/:id/update', () => {
    test('should update user details if logged in as admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Test User 5',
        email: 'test5@test.com',
        passwordHash: hash,
        type: 'facility-staff'
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
        .post(`/admin/users/${user.id}/update`)
        .send({
          name: 'Updated User 5',
          email: 'updated5@test.com',
          password: 'newpass123',
          type: 'government-official'
        })
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);

      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.name).toBe('Updated User 5');
      expect(updatedUser.email).toBe('updated5@test.com');
      expect(updatedUser.type).toBe('government-official');

      await updatedUser.destroy();
    });

    test('should redirect to login page if not logged in when updating user', async () => {
      const response = await request(app)
        .post('/admin/users/1/update')
        .send({
          name: 'Updated Name',
          email: 'updated@test.com',
          password: 'newpass123',
          type: 'facility-staff'
        });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should redirect to / if logged in as non-admin when updating user', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Test User 6',
        email: 'test6@test.com',
        passwordHash: hash,
        type: 'facility-staff'
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
        .post(`/admin/users/${user.id}/update`)
        .send({
          name: 'Updated Name',
          email: 'updated6@test.com',
          password: 'newpass123',
          type: 'government-official'
        })
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');

      await user.destroy();
    });
    test('should not update user if fields are missing', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Failing User',
        email: 'failuser@test.com',
        passwordHash: hash,
        type: 'facility-staff'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'testpass123' });

      const cookies = loginResponse.headers['set-cookie'];
      const response = await request(app)
        .post(`/admin/users/${user.id}/update`)
        .send({ name: '', email: '', password: '', type: '' })
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(`/admin/users/${user.id}`);

      await user.destroy();
    });
  });

  describe('/admin/users/:id/delete', () => {
    test('should delete user if logged in as admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Test User 7',
        email: 'test7@test.com',
        passwordHash: hash,
        type: 'facility-staff'
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
        .get(`/admin/users/${user.id}/delete`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);

      const deletedUser = await User.findByPk(user.id);
      expect(deletedUser).toBeNull();
    });

    test('should redirect to login page if not logged in when deleting user', async () => {
      const response = await request(app)
        .get('/admin/users/1/delete');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should redirect to / if logged in as non-admin when deleting user', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Test User 8',
        email: 'test8@test.com',
        passwordHash: hash,
        type: 'facility-staff'
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
        .get(`/admin/users/${user.id}/delete`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');

      await user.destroy();
    });
    test('should not allow a user to delete themselves', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Self Delete',
        email: 'self@delete.com',
        passwordHash: hash,
        type: 'admin'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'self@delete.com', password: 'testpass123' });

      const cookies = loginResponse.headers['set-cookie'];
      const response = await request(app)
        .get(`/admin/users/${user.id}/delete`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(`/admin/users/${user.id}`);

      await user.destroy();
    });
  });

  describe('/admin/users/:id/jurisdiction', () => {
    test('should update user jurisdiction if logged in as admin', async () => {
      const user = await User.create({
        name: 'The User',
        email: 'email@email.com',
        passwordHash: '8675309',
        type: 'government-official'
      });
      
      const municipality = await Municipality.create({
        name: 'Test Municipality'
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
        .post(`/admin/users/${user.id}/jurisdiction`)
        .send({
          municipality: municipality.id
        })
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);

      const jur = await UserJurisdiction.findOne({
        userId: user.id
      });

      expect(jur).not.toBeNull();
    });

    test('should redirect to login page if not logged in when deleting user', async () => {
      const response = await request(app)
        .post('/admin/users/1/jurisdiction');

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/auth/login');
    });

    test('should redirect to / if logged in as non-admin', async () => {
      const hash = await bcrypt.hash('testpass123', 10);
      const user = await User.create({
        name: 'Test User 8',
        email: 'test8@test.com',
        passwordHash: hash,
        type: 'facility-staff'
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
        .post(`/admin/users/${user.id}/jurisdiction`)
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('/');

      await user.destroy();
    });
    test('should handle missing jurisdiction selection', async () => {
      const user = await User.create({
        name: 'Jurisdictionless',
        email: 'juris@test.com',
        passwordHash: 'hash',
        type: 'government-official'
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'testpass123' });

      const cookies = loginResponse.headers['set-cookie'];
      const response = await request(app)
        .post(`/admin/users/${user.id}/jurisdiction`)
        .send({})
        .set('Cookie', cookies);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(`/admin/users/${user.id}`);

      await user.destroy();
    });
  });
});