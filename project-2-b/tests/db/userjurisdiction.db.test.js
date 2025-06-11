/* eslint-disable no-undef */
'use strict';
const { sequelize, UserJurisdiction, User, Municipality, Ward, District, Region } = require('../../models');

describe('UserJurisdiction Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Associations', () => {
    test('should belong to a User', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'name',
        passwordHash: 'hashedpassword',
        type: 'admin'
      });
      const userJurisdiction = await UserJurisdiction.create({ userId: user.id });
      const foundUserJurisdiction = await UserJurisdiction.findOne({ where: { id: userJurisdiction.id }, include: 'user' });

      expect(foundUserJurisdiction.userId).toBe(user.id);
      expect(foundUserJurisdiction.user).toBeDefined();
    });

    test('should belong to a Municipality', async () => {
      const municipality = await Municipality.create({ name: 'Test Municipality' });

      const user = await User.create({
        email: 'test@example.com',
        name: 'name',
        passwordHash: 'hashedpassword',
        type: 'admin'
      });

      const userJurisdiction = await UserJurisdiction.create({ municipalityId: municipality.id, userId: user.id });
      const foundUserJurisdiction = await UserJurisdiction.findOne({ where: { id: userJurisdiction.id }, include: 'municipality' });

      expect(foundUserJurisdiction.municipalityId).toBe(municipality.id);
      expect(foundUserJurisdiction.municipality).toBeDefined();
    });

    test('should belong to a Ward', async () => {

      const user = await User.create({
        email: 'test@example.com',
        name: 'name',
        passwordHash: 'hashedpassword',
        type: 'admin'
      });

      const ward = await Ward.create({ name: 'Test Ward' });
      const userJurisdiction = await UserJurisdiction.create({ wardId: ward.id, userId: user.id });
      const foundUserJurisdiction = await UserJurisdiction.findOne({ where: { id: userJurisdiction.id }, include: 'ward' });

      expect(foundUserJurisdiction.wardId).toBe(ward.id);
      expect(foundUserJurisdiction.ward).toBeDefined();
    });

    test('should belong to a District', async () => {

      const user = await User.create({
        email: 'test@example.com',
        name: 'name',
        passwordHash: 'hashedpassword',
        type: 'admin'
      });

      const district = await District.create({ name: 'Test District' });
      const userJurisdiction = await UserJurisdiction.create({ districtId: district.id, userId: user.id });
      const foundUserJurisdiction = await UserJurisdiction.findOne({ where: { id: userJurisdiction.id }, include: 'district' });

      expect(foundUserJurisdiction.districtId).toBe(district.id);
      expect(foundUserJurisdiction.district).toBeDefined();
    });

    test('should belong to a Region', async () => {

      const user = await User.create({
        email: 'test@example.com',
        name: 'name',
        passwordHash: 'hashedpassword',
        type: 'admin'
      });

      const region = await Region.create({ name: 'Test Region' });
      const userJurisdiction = await UserJurisdiction.create({ regionId: region.id, userId: user.id });
      const foundUserJurisdiction = await UserJurisdiction.findOne({ where: { id: userJurisdiction.id }, include: 'region' });

      expect(foundUserJurisdiction.regionId).toBe(region.id);
      expect(foundUserJurisdiction.region).toBeDefined();
    });
  });
});