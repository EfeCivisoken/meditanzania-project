/**
 * This controller holds all functions related to survey responses.
 * URL: /admin/response(s)
 */
const { Survey, Region, District, Ward, Municipality, QuestionCategory } = require('../../models');
const fs = require('fs');
const { registerResponses } = require('../../helpers/response');

/**
 * GET /admin/responses
 * calls the views where you can upload a csv survey response
 */
const getUploadResponse = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const surveys = await Survey.findAll();
  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll(); 
  const categories = await QuestionCategory.findAll();

  res.render('admin/responses', {
    surveys,
    messages: {
      success: req.flash('success'),
      error: req.flash('error'),
    },
    regions,
    districts,
    wards,
    municipalities,
    categories,
    userType: req.user.type
  });
};

/**
 * POST /admin/responses/upload
 * Upload a csv file containing survey response
 */
const uploadResponse = async (req, res) => {
  // verify that the user is an admin
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }
  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  // Make sure that we get the survey id and none empty file
  if (
    !req.body.id ||
    req.body.id == '' ||
    !req.files ||
    req.files.length == 0
  ) {
    req.flash(
      'error',
      'Survey Identifier and Responses CSV file are required.'
    );
    res.redirect('/admin/responses');
    return;
  }

  // get survey id
  const id = parseInt(req.body.id);

  // read the uploaded CSV file to process it.
  const filePath = req.files[0].path;
  const contents = fs.readFileSync(filePath);

  console.log(contents);

  try {
    await registerResponses(id, contents);
  } catch (e) {
    req.flash(
      'error',
      'Failed to register survey responses. Please check the file format and try again.'
    );
    res.redirect('/admin/responses');
    return;
  }

  req.flash(
    'success',
    'Successfully registered survey responses from the csv file'
  );
  res.redirect('/admin/responses');
};

module.exports = { getUploadResponse, uploadResponse };
