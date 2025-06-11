/* eslint-disable no-undef */

const { createSurvey } = require('../../helpers/survey');
const { Survey, QuestionCategory } = require('../../models');

require('../setup');

describe('Survey Helper', () => {
  test('survey is correctly created', async () => {
    const csv = `
"question","type","weight","transformation","category"
"test question 1","integer",3,"square",
"test question 2","integer",2,"none","Category 2"
"test question 3","integer",1,"inverse","Another Cat"
"test question 4","text",4,"none",
`;

    await QuestionCategory.create({
      name: 'General'
    });

    await createSurvey(csv, 'Test Survey');

    const survey = await Survey.findOne({
      where: {
        name: 'Test Survey'
      }
    });

    expect(survey).not.toBeNull();

    const questions = await survey.getQuestions();

    expect(questions.length).toBe(4);
    expect(questions[0].weight).toBe(3);
    expect(questions[0].textResponse).toBe(false);
    expect(questions[0].transformation).toBe('square');
    expect(questions[0].text).toBe('test question 1');
    expect(questions[0].categoryId).toBe(1);

    expect(questions[1].weight).toBe(2);
    expect(questions[1].textResponse).toBe(false);
    expect(questions[1].transformation).toBe('none');
    expect(questions[1].text).toBe('test question 2');
    expect(questions[1].categoryId).toBe(2);

    expect(questions[2].weight).toBe(1);
    expect(questions[2].textResponse).toBe(false);
    expect(questions[2].transformation).toBe('inverse');
    expect(questions[2].text).toBe('test question 3');
    expect(questions[2].categoryId).toBe(3);

    expect(questions[3].weight).toBe(4);
    expect(questions[3].textResponse).toBe(true);
    expect(questions[3].transformation).toBe('none');
    expect(questions[3].text).toBe('test question 4');
    expect(questions[3].categoryId).toBe(1);
  });
});