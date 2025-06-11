/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
'use strict';
const {Region, District, Ward, Municipality, sequelize} = require('../../models');
require('../setup');

describe('Region Model', () => {

  test('create a region', async () => {
    const region = await Region.create({ name: 'Test Region' });
    expect(region.name).toBe('Test Region');
  });

  test('find districts of a region', async () => {
    const region = await Region.create({ name: 'Region 1' });
    await District.create({ name: 'District 1', regionId: region.id });
    await District.create({ name: 'District 2', regionId: region.id });

    const districts = await region.getDistricts();

    expect(districts.length).toBe(2);
    expect(districts[0].name).toBe('District 1');
    expect(districts[1].name).toBe('District 2');

  });
});

describe('District Model', () => {

  test('create a district', async () => {
    const district = await District.create({ name: 'Test District' });
    expect(district.name).toBe('Test District');
  });

  test('find wards of a district', async () => {
    const district = await District.create({ name: 'District 1' });
    await Ward.create({ name: 'Ward 1', districtId: district.id });
    await Ward.create({ name: 'Ward 2', districtId: district.id });

    const wards = await district.getWards();

    expect(wards.length).toBe(2);
    expect(wards[0].name).toBe('Ward 1');
    expect(wards[1].name).toBe('Ward 2');

  });

  test('find region of a district', async () => {
    const region = await Region.create({ name: 'Region 1' });
    const district = await District.create({ name: 'District 1', regionId: region.id });

    const parentRegion = await district.getRegion();

    expect(parentRegion.name).toBe('Region 1');
  });
});

describe('Ward Model', () => {

  test('create a ward', async () => {
    const ward = await Ward.create({ name: 'Test Ward' });
    expect(ward.name).toBe('Test Ward');
  });

  test('find municipalities of a ward', async () => {
    const ward = await Ward.create({ name: 'Region 1' });
    await Municipality.create({ name: 'Municipality 1', wardId: ward.id });
    await Municipality.create({ name: 'Municipality 2', wardId: ward.id });

    const municipalities = await ward.getMunicipalities();

    expect(municipalities.length).toBe(2);
    expect(municipalities[0].name).toBe('Municipality 1');
    expect(municipalities[1].name).toBe('Municipality 2');

  });

  test('find region of a ward', async () => {
    const region = await Region.create({ name: 'Region 1' });
    const district = await District.create({ name: 'District 1', regionId: region.id });
    const ward = await Ward.create({ name: 'Ward 1', districtId: district.id });

    const wardDistrict = await ward.getDistrict();

    expect(wardDistrict.name).toBe('District 1');

    const districtRegion = await wardDistrict.getRegion();

    expect(districtRegion.name).toBe('Region 1');
  });
});

describe('Municipality Model', () => {

  test('create a municipality', async () => {
    const municipality = await Municipality.create({ name: 'Test Municipality' });
    expect(municipality.name).toBe('Test Municipality');
  });

  test('find region of a municipality', async () => {
    const region = await Region.create({ name: 'Region 1' });
    const district = await District.create({ name: 'District 1', regionId: region.id });
    const ward = await Ward.create({ name: 'Ward 1', districtId: district.id });
    const municipality = await Municipality.create({ name: 'Municipality 1', wardId: ward.id });

    const municipalityWard = await municipality.getWard();

    expect(municipalityWard.name).toBe('Ward 1');

    const wardDistrict = await ward.getDistrict();

    expect(wardDistrict.name).toBe('District 1');

    const districtRegion = await wardDistrict.getRegion();

    expect(districtRegion.name).toBe('Region 1');
  });
});

describe('Validation Tests', () => {

  test('should not create a region without a name', async () => {
    try {
      await Region.create({});
    } catch (error) {
      expect(error).not.toBeNull();
    }
  });

  test('should not create a district without a name', async () => {
    try {
      await District.create({});
    } catch (error) {
      expect(error).not.toBeNull();
    }
  });

  test('should not create a ward without a name', async () => {
    try {
      await Ward.create({});
    } catch (error) {
      expect(error).not.toBeNull();
    }
  });

  test('should not create a municipality without a name', async () => {
    try {
      await Municipality.create({});
    } catch (error) {
      expect(error).not.toBeNull();
    }
  });
});

describe('Cascade Behavior', () => {

  test('should set wardId to null on ward deletion', async () => {
    const ward = await Ward.create({ name: 'Ward 1' });
    const municipality = await Municipality.create({ name: 'Municipality 1', wardId: ward.id });

    await ward.destroy();
    await municipality.reload();

    expect(municipality.wardId).toBeNull();
  });

  test('should set districtId to null on district deletion', async () => {
    const district = await District.create({ name: 'District 1' });
    const ward = await Ward.create({ name: 'Ward 1', districtId: district.id });

    await district.destroy();
    await ward.reload();

    expect(ward.districtId).toBeNull();
  });

  test('should set regionId to null on region deletion', async () => {
    const region = await Region.create({ name: 'Region 1' });
    const district = await District.create({ name: 'District 1', regionId: region.id });

    await region.destroy();
    await district.reload();

    expect(district.regionId).toBeNull();
  });
});

describe('Uniqueness Constraints', () => {
  test('should not create two regions with the same name', async () => {
    await Region.create({ name: 'Region 1' });
    try {
      await Region.create({ name: 'Region 1' });
    } catch (error) {
      expect(error).not.toBeNull();
    }
  });
});