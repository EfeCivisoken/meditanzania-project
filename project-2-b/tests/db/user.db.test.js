/* eslint-disable no-undef */
'use strict';
const { sequelize, User, Facility, UserJurisdiction, Municipality } = require('../../models');

describe('User Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User creation', () => {
    test('should create a user with valid attributes', async () => {
      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
      
      const facility = await Facility.create({ 
        name: 'Test Facility',
        commonName: 'Test',
        type: 'Clinic',
        status: 'active',
        phoneNumber: '5555555555',
        address: '123 Test Street, Tz',
        email: 'facility@site.tz',
        website: 'site.tz',
        municipalityId: municipality.id
      });

      const user = await User.create({
        email: 'test@example.com',
        name: 'User',
        passwordHash: 'hashedpassword',
        type: 'admin',
        worksAt: facility.id
      });

      expect(user.email).toBe('test@example.com');
      expect(user.passwordHash).toBe('hashedpassword');
      expect(user.type).toBe('admin');
      expect(user.worksAt).toBe(facility.id);
    });

    test('should not create a user with missing email', async () => {
      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
      
      const facility = await Facility.create({ 
        name: 'Test Facility',
        commonName: 'Test',
        type: 'Clinic',
        status: 'active',
        phoneNumber: '5555555555',
        address: '123 Test Street, Tz',
        email: 'facility@site.tz',
        website: 'site.tz',
        municipalityId: municipality.id
      });

      await expect(User.create({
        name: 'User',
        passwordHash: 'hashedpassword',
        type: 'admin',
        worksAt: facility.id
      })).rejects.toThrow();
    });

    test('should not create a user with missing passwordHash', async () => {
      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
      
      const facility = await Facility.create({ 
        name: 'Test Facility',
        commonName: 'Test',
        type: 'Clinic',
        status: 'active',
        phoneNumber: '5555555555',
        address: '123 Test Street, Tz',
        email: 'facility@site.tz',
        website: 'site.tz',
        municipalityId: municipality.id
      });

      await expect(User.create({
        email: 'test@example.com',
        name: 'User',
        type: 'admin',
        worksAt: facility.id
      })).rejects.toThrow();
    });

    test('should not create a user with missing type', async () => {
      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
      
      const facility = await Facility.create({ 
        name: 'Test Facility',
        commonName: 'Test',
        type: 'Clinic',
        status: 'active',
        phoneNumber: '5555555555',
        address: '123 Test Street, Tz',
        email: 'facility@site.tz',
        website: 'site.tz',
        municipalityId: municipality.id
      });

      await expect(User.create({
        email: 'test@example.com',
        name: 'User',
        passwordHash: 'hashedpassword',
        worksAt: facility.id
      })).rejects.toThrow();
    });
    test('should not create a user with missing name', async () => {
      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
      
      const facility = await Facility.create({ 
        name: 'Test Facility',
        commonName: 'Test',
        type: 'Clinic',
        status: 'active',
        phoneNumber: '5555555555',
        address: '123 Test Street, Tz',
        email: 'facility@site.tz',
        website: 'site.tz',
        municipalityId: municipality.id
      });

      await expect(User.create({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        worksAt: facility.id
      })).rejects.toThrow();
    });
  });

  describe('Associations', () => {
    test('should associate user with a facility', async () => {
      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
      
      const facility = await Facility.create({ 
        name: 'Test Facility',
        commonName: 'Test',
        type: 'Clinic',
        status: 'active',
        phoneNumber: '5555555555',
        address: '123 Test Street, Tz',
        email: 'facility@site.tz',
        website: 'site.tz',
        municipalityId: municipality.id
      });

      const user = await User.create({
        email: 'test@example.com',
        name: 'User',
        passwordHash: 'hashedpassword',
        type: 'careprovider',
        worksAt: facility.id
      });

      const foundUser = await User.findOne({
        where: { id: user.id },
        include: [{ model: Facility, as: 'facility' }]
      });

      expect(foundUser.facility.name).toBe('Test Facility');
    });

    test('should associate user with a jurisdiction', async () => {
      const municipality = await Municipality.create({
        name: 'Test Municipality'
      });
      
      const facility = await Facility.create({ 
        name: 'Test Facility',
        commonName: 'Test',
        type: 'Clinic',
        status: 'active',
        phoneNumber: '5555555555',
        address: '123 Test Street, Tz',
        email: 'facility@site.tz',
        website: 'site.tz',
        municipalityId: municipality.id
      });

      const user = await User.create({
        email: 'test@example.com',
        name: 'User',
        passwordHash: 'hashedpassword',
        type: 'admin',
        worksAt: facility.id
      });

      await UserJurisdiction.create({
        userId: user.id,
        municipalityId: municipality.id
      });

      const foundUser = await User.findOne({
        where: { id: user.id },
        include: [{ model: UserJurisdiction, as: 'jurisdiction' }]
      });

      expect(foundUser.jurisdiction.municipalityId).toBe(municipality.id);
    });
  });
});