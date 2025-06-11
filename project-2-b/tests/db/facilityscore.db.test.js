

const { sequelize, Facility, QuestionCategory, Municipality, FacilityScore } = require('../../models');

describe('FacilityScore Model', () => {
  let facility, category, municipality;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    municipality = await Municipality.create({
      name: 'Test Municipality'
    });

    facility = await Facility.create({
      name: 'Test Facility',
      municipalityId: municipality.id,
    });

    category = await QuestionCategory.create({
      name: 'Cleanliness'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await FacilityScore.destroy({ where: {} });
  });

  test('should create a FacilityScore with valid data', async () => {
    const score = await FacilityScore.create({
      facilityId: facility.id,
      score: 4.5,
      categoryId: category.id
    });

    expect(score).toBeDefined();
    expect(score.score).toBe(4.5);
    expect(score.facilityId).toBe(facility.id);
    expect(score.categoryId).toBe(category.id);
  });

  test('should not allow null score', async () => {
    await expect(FacilityScore.create({
      facilityId: facility.id,
      categoryId: category.id
    })).rejects.toThrow();
  });

  test('should associate with Facility correctly', async () => {
    const score = await FacilityScore.create({
      facilityId: facility.id,
      score: 3.0,
      categoryId: category.id
    });

    const associatedFacility = await score.getFacility();
    expect(associatedFacility).toBeDefined();
    expect(associatedFacility.id).toBe(facility.id);
  });
});