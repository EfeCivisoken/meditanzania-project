/* eslint-disable no-undef */
'use strict';
const { sequelize, Survey, Question } = require('../../models');

describe('Survey Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should create a survey', async () => {
    const survey = await Survey.create({ name: 'Test Survey' });
    expect(survey.name).toBe('Test Survey');
  });

  test('should associate survey with questions', async () => {
    const survey = await Survey.create({ name: 'Test Survey' });
    await Question.create({ 
      text: 'Test question', 
      surveyId: survey.id, 
      textResponse: false });

    const surveyWithQuestions = await Survey.findOne({
      where: { id: survey.id },
      include: [{ model: Question, as: 'questions' }]
    });

    expect(surveyWithQuestions.questions.length).toBe(1);
    expect(surveyWithQuestions.questions[0].text).toBe('Test question');
  });

  test('should delete a survey', async () => {
    const survey = await Survey.create({ name: 'Test Survey' });
    await survey.destroy();

    const deletedSurvey = await Survey.findByPk(survey.id);
    expect(deletedSurvey).toBeNull();
  });

  test('should update a survey name', async () => {
    const survey = await Survey.create({ name: 'Test Survey' });
    survey.name = 'Updated Test Survey';
    await survey.save();

    const updatedSurvey = await Survey.findByPk(survey.id);
    expect(updatedSurvey.name).toBe('Updated Test Survey');
  });
});