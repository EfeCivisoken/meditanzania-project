/* eslint-disable no-undef */
'use strict';
const { sequelize, SurveyResponse, Survey, Facility, QuestionResponse, Municipality, Question } = require('../../models');

describe('SurveyResponse Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should create a SurveyResponse', async () => {
    const survey = await Survey.create({
      name: 'Test Survey'
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

    expect(surveyResponse).toBeDefined();
    expect(surveyResponse.surveyId).toBe(survey.id);
    expect(surveyResponse.facilityId).toBe(facility.id);
  });

  test('should associate SurveyResponse with Survey', async () => {
    const survey = await Survey.create({
      name: 'Test Survey'
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

    const fetchedSurveyResponse = await SurveyResponse.findByPk(surveyResponse.id, {
      include: [{ model: Survey, as: 'survey' }]
    });

    expect(fetchedSurveyResponse.survey).toBeDefined();
    expect(fetchedSurveyResponse.survey.name).toBe('Test Survey');
  });

  test('should associate SurveyResponse with Facility', async () => {
    const survey = await Survey.create({
      name: 'Test Survey'
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

    const fetchedSurveyResponse = await SurveyResponse.findByPk(surveyResponse.id, {
      include: [{ model: Facility, as: 'facility' }]
    });

    expect(fetchedSurveyResponse.facility).toBeDefined();
    expect(fetchedSurveyResponse.facility.name).toBe('Test Facility');
  });

  test('should associate SurveyResponse with QuestionResponses', async () => {
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

    await QuestionResponse.create({
      questionId: question.id,
      surveyResponseId: surveyResponse.id,
      responseInt: null,
      responseText: 'Sample response'
    });

    const fetchedSurveyResponse = await SurveyResponse.findByPk(surveyResponse.id, {
      include: [{ model: QuestionResponse, as: 'questionResponses' }]
    });

    expect(fetchedSurveyResponse.questionResponses).toBeDefined();
    expect(fetchedSurveyResponse.questionResponses.length).toBe(1);
    expect(fetchedSurveyResponse.questionResponses[0].responseText).toBe('Sample response');
  });
});