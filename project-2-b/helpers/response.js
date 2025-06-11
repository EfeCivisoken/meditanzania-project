const { parse } = require('csv-parse/sync');
const {
  Survey,
  Question,
  SurveyResponse,
  QuestionResponse,
  Facility,
  FacilityScore
} = require('../models');
const { calculateScore } = require('./score');

/**
 * Register survey responses from a CSV-formatted string to the database.
 *
 * @param {number} survey - The id of the survey we are adding responses to
 * @param {string} csv - CSV-formatted string to parse
 *
 * Expects a table like the following:
 *
 * | facility | phone |   Q1   |   Q2   |  ...   |   Q4   |
 * |----------|-------|--------|--------|--------|--------|
 * |    id    |  num  |   any  |   any  |  ...   |   any  |
 */
const registerResponses = async (survey, csv) => {
  // check if the survey id is even valid
  const surveyRecord = await Survey.findByPk(survey);
  if (!surveyRecord) {
    console.error(
      `Survey with id ${survey} does not exist. Aborting registration.`
    );
    return;
  }

  // Parse CSV content into an array of objects
  const responsesData = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  // Get the CSV header names from the first row and extract question headers.
  // "facility" and "phone" are not question responses.
  const csvColumns = Object.keys(responsesData[0]);
  const csvQuestions = csvColumns.filter(
    (header) => header !== 'facility' && header !== 'phone'
  );

  // Fetch all questions for the given survey, including their text and textResponse flag
  const surveyQuestions = await Question.findAll({
    where: { surveyId: survey },
    attributes: ['id', 'text', 'textResponse'],
  });

  // Create a dictionary mapping question text to question details
  // This is to help simplify comparison and registration later
  const questionDict = {};
  for (const question of surveyQuestions) {
    // We use the question text as the key (ensure this matches how your CSV questions are defined)
    questionDict[question.text] = {
      id: question.id,
      textResponse: question.textResponse,
    };
  }

  // Validate: Check that every CSV question header exists in the survey's questions
  for (const csvQuestion of csvQuestions) {
    if (!questionDict[csvQuestion]) {
      console.error(
        `CSV question "${csvQuestion}" does not exist in survey questions. Aborting...`
      );
      return;
    }
  }

  // Ensure every survey question is present in the CSV
  for (const surveyQuestion of surveyQuestions) {
    if (!csvQuestions.includes(surveyQuestion.text)) {
      console.error(
        `Survey question "${surveyQuestion.text}" is missing in CSV headers. Aborting...`
      );
      return;
    }
  }

  // Process each row from the CSV
  for (const row of responsesData) {
    // Create a SurveyResponse for the current row and link the right facility and survey definition
    const surveyResponse = await SurveyResponse.create({
      surveyId: survey,
      // make sure to parse the facility id to Int because the csv value is string
      facilityId: parseInt(row.facility),
    });

    // Use the question dictionary to create the matching QuestionResponse for each CSV question
    for (const csvQuestion of csvQuestions) {
      // Get id and if it accepts text response. Rename id to questionId to be consistent with database
      const { id: questionId, textResponse } = questionDict[csvQuestion];
      const responseValue = row[csvQuestion];

      // Construct the base data for the QuestionResponse
      const questionResponseData = {
        questionId,
        surveyResponseId: surveyResponse.id,
      };

      // Depending on whether the question expects text or an integer, assign the value appropriately.
      if (textResponse) {
        questionResponseData.responseText = responseValue;
      } else {
        const intVal = parseInt(responseValue);
        questionResponseData.responseInt = isNaN(intVal) ? null : intVal;
      }

      // Create the QuestionResponse record
      await QuestionResponse.create(questionResponseData);
    }
    // Then it goes to the next row
  }

  // Calculate new scores for each facility.
  const facilities = await Facility.findAll();
  
  for (const facility of facilities) {
    const id = facility.id;
    const { overallScore, categoryScores } = await calculateScore(id);

    // Store overall score
    await FacilityScore.create({
      facilityId: id,
      score: overallScore,
      categoryId: 1
    });

    // Map category name to id and store each category score
    const surveyResponses = await facility.getSurveyResponses();
    const addedCategoryIds = new Set();

    for (const sr of surveyResponses) {
      const questionResponses = await sr.getQuestionResponses();

      for (const qr of questionResponses) {
        const question = await qr.getQuestion();
        const category = await question.getCategory();

        if (category && categoryScores[category.name] !== undefined && !addedCategoryIds.has(category.id)) {
          await FacilityScore.create({
            facilityId: id,
            score: categoryScores[category.name],
            categoryId: category.id
          });

          addedCategoryIds.add(category.id);
        }
      }
    }
  }
};

// something lacking here is to phone record in survey responses

module.exports = { registerResponses };
