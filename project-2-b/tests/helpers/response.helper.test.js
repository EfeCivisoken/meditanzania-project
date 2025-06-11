const { registerResponses } = require('../../helpers/response');
const { sequelize, Facility, Survey, Question, SurveyResponse, QuestionResponse, QuestionCategory, Municipality } = require('../../models');

describe('registerResponses', () => {
  let facility, survey, questions;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const municipality = await Municipality.create({ name: 'Test Municipality' });
    facility = await Facility.create({ name: 'Test Facility', municipalityId: municipality.id });

    const category = await QuestionCategory.create({ name: 'Test Category' });

    survey = await Survey.create({ name: 'Health Survey' });

    questions = await Promise.all([
      Question.create({
        surveyId: survey.id,
        text: 'Cleanliness',
        textResponse: false,
        categoryId: category.id
      }),
      Question.create({
        surveyId: survey.id,
        text: 'Staff attitude',
        textResponse: true,
        categoryId: category.id
      }),
    ]);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should register responses from valid CSV', async () => {
    const csv = `facility,phone,Cleanliness,Staff attitude
${facility.id},1234567890,4,Friendly`;

    await registerResponses(survey.id, csv);

    const responses = await SurveyResponse.findAll({ where: { facilityId: facility.id } });
    expect(responses.length).toBe(1);

    const questionResponses = await QuestionResponse.findAll({ where: { surveyResponseId: responses[0].id } });
    expect(questionResponses.length).toBe(2);

    const q1 = questionResponses.find(q => q.questionId === questions[0].id);
    const q2 = questionResponses.find(q => q.questionId === questions[1].id);
    expect(q1.responseInt).toBe(4);
    expect(q2.responseText).toBe('Friendly');
  });

  test('should not register if survey ID is invalid', async () => {
    const csv = `facility,phone,Cleanliness,Staff attitude
${facility.id},1234567890,5,Polite`;

    const result = await registerResponses(9999, csv);
    expect(result).toBeUndefined();

    const responses = await SurveyResponse.findAll({ where: { facilityId: facility.id } });
    expect(responses.length).toBe(1);
  });
});
