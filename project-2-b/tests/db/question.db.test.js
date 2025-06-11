/* eslint-disable no-undef */
'use strict';
const { sequelize, Survey, Question } = require('../../models');

describe('Question Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should create a Question', async () => {
    const survey = await Survey.create({
      name: 'Test Survey'
    });

    const question = await Question.create({
      surveyId: survey.id,
      text: 'Test 21',
      textResponse: true
    });
    expect(question).toBeDefined();
    expect(question.text).toBe('Test 21');
  });

  test('should not create a Question with null surveyId', async () => {
    try {
      await Question.create({
        surveyId: null,
        text: 'Uh-oh!',
        textResponse: true
      });
    } catch (error) {
      expect(error.name).toBe('SequelizeValidationError');
    }
  });

  test('should not create a Question with null text', async () => {
    try {
      await Question.create({
        surveyId: 1,
        text: null,
        textResponse: true
      });
    } catch (error) {
      expect(error.name).toBe('SequelizeValidationError');
    }
  });

  test('should not create a Question with null textResponse', async () => {
    try {
      await Question.create({
        surveyId: 1,
        text: 'What is your favorite color?',
        textResponse: null
      });
    } catch (error) {
      expect(error.name).toBe('SequelizeValidationError');
    }
  });
});