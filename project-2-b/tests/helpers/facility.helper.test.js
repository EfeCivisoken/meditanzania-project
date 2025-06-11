const { sequelize, Facility, Municipality, Ward, District, Region } = require('../../models');
const { getFacilitiesByJurisdiction } = require('../../helpers/facility');

describe('getFacilitiesByJurisdiction', () => {
  let region, district, ward, municipality, facility;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    region = await Region.create({ name: 'Test Region' });
    district = await District.create({ name: 'Test District', regionId: region.id });
    ward = await Ward.create({ name: 'Test Ward', districtId: district.id });
    municipality = await Municipality.create({ name: 'Test Municipality', wardId: ward.id });
    facility = await Facility.create({ name: 'Test Facility', municipalityId: municipality.id });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('returns facilities in a given municipality', async () => {
    const facilities = await getFacilitiesByJurisdiction('municipality', municipality.id);
    expect(facilities.length).toBe(1);
    expect(facilities[0].name).toBe('Test Facility');
  });

  test('returns facilities in a given ward', async () => {
    const facilities = await getFacilitiesByJurisdiction('ward', ward.id);
    expect(facilities.length).toBe(1);
    expect(facilities[0].name).toBe('Test Facility');
  });

  test('returns facilities in a given district', async () => {
    const facilities = await getFacilitiesByJurisdiction('district', district.id);
    expect(facilities.length).toBe(1);
    expect(facilities[0].name).toBe('Test Facility');
  });

  test('returns facilities in a given region', async () => {
    const facilities = await getFacilitiesByJurisdiction('region', region.id);
    expect(facilities.length).toBe(1);
    expect(facilities[0].name).toBe('Test Facility');
  });

  test('returns empty array for invalid jurisdiction type', async () => {
    const facilities = await getFacilitiesByJurisdiction('invalid', 1);
    expect(facilities).toEqual([]);
  });
});
