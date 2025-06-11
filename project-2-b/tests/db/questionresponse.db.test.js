/* eslint-disable no-undef */
'use strict';
const { sequelize, QuestionResponse, Question, SurveyResponse, Survey, Municipality, Facility } = require('../../models');

describe('QuestionResponse Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should create a QuestionResponse with valid data', async () => {

    const survey = await Survey.create({
      name: 'Test Survey'
    });

    const question = await Question.create({
      surveyId: survey.id,
      text: 'Test 21',
      textResponse: true
    });

    const municipality = await Municipality.create({ name: 'Test Municipality' });

    const facility = await Facility.create({
      name: 'Test Facility',
      commonName: 'Test Common Name',
      type: 'Test Type',
      status: 'Active',
      phoneNumber: '1234567890',
      address: '123 Test St',
      email: 'test@example.com',
      website: 'http://test.com',
      municipalityId: municipality.id
    });

    const surveyResponse = await SurveyResponse.create({
      facilityId: facility.id,
      surveyId: survey.id
    });

    const questionResponse = await QuestionResponse.create({
      questionId: question.id,
      surveyResponseId: surveyResponse.id,
      responseInt: null,
      responseText: 'Sample response'
    });

    expect(questionResponse).toBeDefined();
    expect(questionResponse.questionId).toBe(1);
    expect(questionResponse.surveyResponseId).toBe(1);
    expect(questionResponse.responseInt).toBeNull();
    expect(questionResponse.responseText).toBe('Sample response');
  });

  test('should not create a QuestionResponse with null questionId', async () => {
    await expect(QuestionResponse.create({
      questionId: null,
      surveyResponseId: 1,
      responseInt: 5,
      responseText: 'Sample response'
    })).rejects.toThrow();
  });

  test('should not create a QuestionResponse with null surveyResponseId', async () => {
    await expect(QuestionResponse.create({
      questionId: 1,
      surveyResponseId: null,
      responseInt: 5,
      responseText: 'Sample response'
    })).rejects.toThrow();
  });

  test('should create a QuestionResponse with null responseInt and responseText', async () => {

    const survey = await Survey.create({
      name: 'Test Survey'
    });

    const question = await Question.create({
      surveyId: survey.id,
      text: 'Test 21',
      textResponse: true
    });

    const municipality = await Municipality.create({ name: 'Test Municipality' });

    const facility = await Facility.create({
      name: 'Test Facility',
      commonName: 'Test Common Name',
      type: 'Test Type',
      status: 'Active',
      phoneNumber: '1234567890',
      address: '123 Test St',
      email: 'test@example.com',
      website: 'http://test.com',
      municipalityId: municipality.id
    });

    const surveyResponse = await SurveyResponse.create({
      facilityId: facility.id,
      surveyId: survey.id
    });

    const questionResponse = await QuestionResponse.create({
      questionId: question.id,
      surveyResponseId: surveyResponse.id,
      responseInt: null,
      responseText: null
    });

    expect(questionResponse).toBeDefined();
    expect(questionResponse.questionId).toBe(question.id);
    expect(questionResponse.surveyResponseId).toBe(surveyResponse.id);
    expect(questionResponse.responseInt).toBeNull();
    expect(questionResponse.responseText).toBeNull();
  });
});