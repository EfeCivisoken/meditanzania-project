/**
 * This controller holds all functions related to surveys.
 * URL: /admin/survey(s)
 */
const { createSurvey } = require('../../helpers/survey');
const { Survey, Region, District, Ward, Municipality, QuestionCategory } = require('../../models');
const fs = require('fs');

/**
 * GET /admin/surveys
 * Presents a list of surveys along with a form to create a new survey.
 */
const listSurveys = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const { count, rows: surveys } = await Survey.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  });

  const totalPages = Math.ceil(count / limit);

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll(); 
  const categories = await QuestionCategory.findAll();

  res.render('admin/surveys', {
    surveys,
    messages: {
      success: req.flash('success'),
      error: req.flash('error')
    },
    userType: req.user.type,
    regions,
    districts,
    wards,
    municipalities,
    categories,
    currentPage: page,
    totalPages
  });
};

/**
 * POST /admin/surveys/create
 * Creates a new survey from a given CSV file.
 */
const uploadSurvey = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  if(!req.body.name || req.body.name == '' || !req.files || req.files.length == 0) {
    req.flash('error', 'Survey name and file are required.');
    res.redirect('/admin/surveys');
    return;
  }

  const name = req.body.name;
  
  // read the uploaded CSV file to process it.
  const filePath = req.files[0].path;
  const contents = fs.readFileSync(filePath);
  const csvString = contents.toString('utf-8');

  console.log(csvString);

  try {
    await createSurvey(csvString, name);
  } catch (e) {
    req.flash('error', 'Failed to create survey. Please check the file format and try again.');
    res.redirect('/admin/surveys');
    return;
  }

  req.flash('success', 'Successfully created the survey.');
  res.redirect('/admin/surveys');
};

/**
 * GET /admin/surveys/:id
 * Shows the given survey's information.
 */
const viewSurvey = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const survey = await Survey.findOne({
    where: {
      id: req.params.id
    }
  });

  if(!survey) {
    res.sendStatus(404);
    return;
  }

  const limit = 10;

  const pageQuestion = parseInt(req.query.pageQuestion) || 1;
  const offsetQuestion = (pageQuestion - 1) * limit;
  const questionCount = await survey.countQuestions();
  const questions = await survey.getQuestions({
    offset: offsetQuestion,
    limit
  });

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();

  const categories = await QuestionCategory.findAll();

  console.log(questions);

  res.render('admin/survey', {
    questions,
    surveyName: survey.name,
    surveyId: survey.id,
    messages: {
      success: req.flash('success'),
      error: req.flash('error')
    },
    userType: req.user.type,
    regions,
    districts,
    wards,
    municipalities,
    categories,
    pageQuestion,
    totalPagesQuestion: Math.ceil(questionCount / limit),
  });
};

/**
 * POST /admin/surveys/:id/update
 * Change the name of a survey
 */
const updateSurvey = async (req, res) => {
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
    req.flash('error', 'Survey name and file are required.');
    res.redirect(`/admin/surveys/${req.params.id}`);
    return;
  }

  const survey = await Survey.findOne({
    where: {
      id: req.params.id
    }
  });

  if(!survey) {
    req.flash('error', 'Survey not found.');
    res.redirect('/admin/surveys');
    return;
  }

  const name = req.body.name;

  survey.name = name;
  await survey.save();

  req.flash('success', 'Successfully created the survey.');
  res.redirect('/admin/surveys');
};

module.exports = { listSurveys, uploadSurvey, viewSurvey, updateSurvey };