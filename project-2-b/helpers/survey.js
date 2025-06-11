const { parse } = require('csv-parse/sync');
const { Survey, Question, QuestionCategory } = require('../models');
const { Op } = require('sequelize');

/**
 * Creates a survey from a CSV-formatted string.
 * 
 * @param {*} csv CSV-formatted string to parse
 * 
 * Expects a table like the following:
 * 
 * | question | type | weight | transformation |    category    |
 * |----------|------|--------|----------------|----------------|
 * |    q1    | text |   3    |     square     |  Mistreatment  |
 * 
 * @param {*} name the name of the survey to create 
 */
const createSurvey = async (csv, name) => {
  const surveyData = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });

  const requiredColumns = ['question', 'type', 'weight', 'transformation', 'category'];
  const hasAllColumns = requiredColumns.every(col => col in surveyData[0]);

  if (!surveyData.length || !hasAllColumns) {
    console.log('missing or malformed columns:', Object.keys(surveyData[0] ?? {}));
    throw new Error('Missing or malformed columns in CSV header');
  }

  const survey = await Survey.create({
    name: name
  });

  console.log('created survey ', name);

  for (const row of surveyData) {
    let category;

    if (row.category === '') {
      category = await QuestionCategory.findOne({
        where: { id: 1 }
      });
    } else {
      category = await QuestionCategory.findOne({
        where: {
          name: { [Op.like]: row.category }
        }
      });

      if (!category) {
        category = await QuestionCategory.create({
          name: row.category
        });
      }
    }

    await Question.create({
      surveyId: survey.id,
      text: row.question,
      textResponse: row.type === 'text',
      weight: row.weight,
      transformation: row.transformation,
      categoryId: category.id
    });
  }
};

module.exports = { createSurvey };