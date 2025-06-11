/* eslint-disable no-undef */
'use strict';
const { sequelize, Facility, SurveyResponse, Municipality, User, AlternativeFeedback, Survey } = require('../../models');


describe('Facility Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('should create a Facility', async () => {
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

    expect(facility).toBeDefined();
    expect(facility.name).toBe('Test Facility');
  });

  test('should associate Facility with Municipality', async () => {
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

    const fetchedFacility = await Facility.findByPk(facility.id, { include: 'location' });
    expect(fetchedFacility.location.name).toBe('Test Municipality');
  });

  test('should associate Facility with Users', async () => {
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

    await User.create({ 
      worksAt: facility.id,
      name: 'Name',
      type: 'testtype',
      email: 'test@test.com',
      passwordHash: 'hash'
    });

    let employees = await facility.getEmployees();

    expect(employees.length).toBe(1);
    expect(employees[0].email).toBe('test@test.com');
  });

  test('should associate Facility with SurveyResponse', async () => {
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

    const survey = await Survey.create({ title: 'Test Survey' });
    const surveyResponse = await SurveyResponse.create({
      surveyId: survey.id,
      facilityId: facility.id
    });

    const fetchedSurveyResponse = await SurveyResponse.findByPk(surveyResponse.id, { include: 'facility' });
    expect(fetchedSurveyResponse.facility.name).toBe('Test Facility');
  });
});