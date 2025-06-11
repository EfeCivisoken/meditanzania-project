const { Question, QuestionCategory, Region, District, Ward, Municipality } = require('../../models');

/**
 * GET /admin/surveys/questions/:id
 * Returns information about a given survey question
 * REQUIRES ADMINISTRATOR PRIVILEGES
 */
const viewQuestion = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const question = await Question.findOne({
    where: {
      id: req.params.id
    },
    include: [{ model: QuestionCategory, as: 'category' }]
  });

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll(); 
  const categories = await QuestionCategory.findAll();

  const questionCategories = await QuestionCategory.findAll();

  if(!question) {
    res.status(404).send('Question not found.');
    return;
  }

  res.render('admin/survey-question', { 
    question, 
    survey: await question.getSurvey(), 
    questionCategories,
    regions,
    districts,
    wards,
    municipalities,
    categories,
    userType: req.user.type,
    messages: req.flash()
  });
};


/**
 * POST /admin/surveys/question/:id/update
 * Updates a question.
 * REQUIRES ADMINISTRATOR PRIVILEGES
 */
const updateQuestion = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const question = await Question.findOne({
    where: {
      id: req.params.id
    }
  });

  if(!question) {
    res.status(404).send('Question not found.');
    return;
  }

  if((!req.body.text || req.body.text == '') || (!req.body.weight || req.body.weight == '') || (!req.body.transformation || req.body.transformation == '') || (!req.body.category || req.body.category == '')) {
    req.flash('error', 'All fields must be provided!');
    res.redirect(`/admin/surveys/questions/${req.params.id}`);
    return;
  }

  const categoryTest = await QuestionCategory.findOne({
    where: {
      id: req.body.category
    }
  });

  if(!categoryTest) {
    req.flash('error', 'You didn\'t specify a valid category id.');
    res.redirect(`/admin/surveys/questions/${req.params.id}`);
    return;
  }

  question.text = req.body.text.trim();
  question.weight = req.body.weight;
  question.transformation = req.body.transformation;
  question.categoryId = categoryTest.id;

  await question.save();

  res.redirect(`/admin/surveys/questions/${req.params.id}`);
};

/**
 * POST /admin/surveys/questions/categories/create
 * Create a new survey question category
 */
const createCategory = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  if(!req.body.name || req.body.name == '') {
    req.flash('error', 'Name not defined.');
    res.redirect('/admin');
    return;
  }

  await QuestionCategory.create({
    name: req.body.name
  });

  req.flash('success', 'Category created.');
  res.redirect(req.get('Referer') || '/admin/');
  return;
};

module.exports = { viewQuestion, updateQuestion, createCategory };