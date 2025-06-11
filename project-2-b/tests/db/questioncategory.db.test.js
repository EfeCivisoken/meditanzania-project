const { QuestionCategory, Question, Survey } = require('../../models');
const { sequelize } = require('../../models');

describe('QuestionCategory Model', () => {

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  test('should define the model correctly', () => {
    expect(QuestionCategory).toBeDefined();
  });

  test('should create a category with valid name', async () => {
    const category = await QuestionCategory.create({ name: 'Cleanliness' });
    expect(category).toBeDefined();
    expect(category.name).toBe('Cleanliness');
  });

  test('should not allow null name', async () => {
    expect.assertions(1);
    try {
      await QuestionCategory.create({});
    } catch (err) {
      expect(err.name).toBe('SequelizeValidationError');
    }
  });

  test('should associate with Questions properly', async () => {
    const category = await QuestionCategory.create({ name: 'Health' });
    const survey = await Survey.create({ name: 'Test Survey' });
    const question = await Question.create({
      text: 'Is there a handwashing station?',
      textResponse: false,
      weight: 1,
      transformation: 'none',
      categoryId: category.id,
      surveyId: survey.id
    });
    const associatedQuestions = await category.getQuestions();
    expect(associatedQuestions.length).toBe(1);
    expect(associatedQuestions[0].text).toBe('Is there a handwashing station?');
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
