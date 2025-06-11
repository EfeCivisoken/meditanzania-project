const { sequelize, Facility, SurveyResponse, QuestionResponse, Question, Municipality, Survey, Region, District, Ward, FacilityScore, QuestionCategory } = require('../../models');
const { calculateScore, topNlowNByCatByJur } = require('../../helpers/score');

require('../setup');

describe('score helper', () => {
  describe('calculateScore', () => {
    let facility;

    beforeAll(async () => {
      await sequelize.sync({ force: true });

      const municipality = await Municipality.create({
        name: 'Test Town'
      });

      facility = await Facility.create({
        name: 'Test Clinic',
        type: 'hospital',
        commonName: 'Test',
        status: 'active',
        phoneNumber: '123-456-7890',
        address: '123 Test St',
        email: 'test@example.com',
        website: 'https://example.com',
        municipalityId: municipality.id
      });

      const survey = await Survey.create({
        name: 'Test Survey'
      });

      const surveyResponse = await SurveyResponse.create({
        facilityId: facility.id,
        surveyId: survey.id
      });

      const question1 = await Question.create({
        surveyId: survey.id, // update if survey association is used
        text: 'How clean was the facility?',
        textResponse: false,
        weight: 2.0,
        transformation: 'square'
      });

      const question2 = await Question.create({
        surveyId: survey.id,
        text: 'How friendly was the staff?',
        textResponse: false,
        weight: 1.5,
        transformation: 'sqrt'
      });

      await QuestionResponse.bulkCreate([
        {
          surveyResponseId: surveyResponse.id,
          questionId: question1.id,
          responseInt: 4
        },
        {
          surveyResponseId: surveyResponse.id,
          questionId: question2.id,
          responseInt: 9
        }
      ]);
    });

    test('computes score correctly with square and sqrt transforms', async () => {
      const score = await calculateScore(facility.id);
      expect(score.overallScore).toBeCloseTo(3.42, 1);
    });

    test('throws if facility does not exist', async () => {
      await expect(calculateScore(-1)).rejects.toThrow('Facility with id -1 does not exist.');
    });
  });

  
  describe('topNlowNByCatByJur', () => {
    let region, district, ward, municipality, facility1, facility2, facility3, category;

    beforeAll(async () => {
      await sequelize.sync({ force: true });

      
    });

    test('returns top and bottom facilities', async () => {

      const region = await Region.create({ name: 'Test Region' });
      const district = await District.create({ name: 'Test District', regionId: region.id });
      const ward = await Ward.create({ name: 'Test Ward', districtId: district.id });
      const municipality = await Municipality.create({ name: 'Test Municipality', wardId: ward.id });

      const facility1 = await Facility.create({ name: 'F1', municipalityId: municipality.id });
      const facility2 = await Facility.create({ name: 'F2', municipalityId: municipality.id });
      const facility3 = await Facility.create({ name: 'F3', municipalityId: municipality.id });

      const survey = await Survey.create({ name: 'Survey' });

      const category = await QuestionCategory.create({ name: 'Default' });

      const q1 = await Question.create({
        surveyId: survey.id,
        text: 'Q',
        textResponse: false,
        weight: 1,
        transformation: 'none',
        categoryId: category.id
      });

      const sr1 = await SurveyResponse.create({ surveyId: survey.id, facilityId: facility1.id });
      const sr2 = await SurveyResponse.create({ surveyId: survey.id, facilityId: facility2.id });
      const sr3 = await SurveyResponse.create({ surveyId: survey.id, facilityId: facility3.id });

      await QuestionResponse.create({ surveyResponseId: sr1.id, questionId: q1.id, responseInt: 1 });
      await QuestionResponse.create({ surveyResponseId: sr2.id, questionId: q1.id, responseInt: 2 });
      await QuestionResponse.create({ surveyResponseId: sr3.id, questionId: q1.id, responseInt: 3 });

      await FacilityScore.bulkCreate([
        { facilityId: facility1.id, categoryId: 1, score: 1 },
        { facilityId: facility2.id, categoryId: 1, score: 2 },
        { facilityId: facility3.id, categoryId: 1, score: 3 }
      ]);

      const result = await topNlowNByCatByJur(
        'municipality',
        municipality.id,
        category.id,
        1
      );

      expect(result.topN.length).toBe(1);
      expect(result.lowN.length).toBe(1);
      expect(result.topN[0].score).toBe(3);
      expect(result.lowN[0].score).toBe(1);
    });
  });

});