const bcrypt = require('bcrypt');
const { Region, District, Ward, Municipality, QuestionCategory } = require('../models');

/**
 * GET /user/updatepass
 * Display update password form
 */
const updatePassForm = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You\'re not signed in!');
    res.redirect('/');
    return;
  }

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  res.render('update-pass', {
    userType: req.user.type,
    regions,
    districts,
    wards,
    municipalities,
    categories,
    messages: {
      success: req.flash('success'),
      error: req.flash('error')
    }
  });
};

/**
 * POST /user/updatepass
 * Update user's password
 */
const updatePass = (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You\'re not signed in!');
    res.redirect('/');
    return;
  }

  if(!req.body.old || req.body.old == '' || !req.body.new || req.body.new == '') {
    req.flash('error', 'All fields are required!');
    res.redirect('/user/updatepass');
    return;
  }

  if(!bcrypt.compareSync(req.body.old, req.user.passwordHash)) {
    req.flash('error', 'Old password not correct!');
    res.redirect('/user/updatepass');
    return;
  }

  req.user.passwordHash = bcrypt.hashSync(req.body.new, 10);
  req.user.save();

  res.redirect('/auth/logout');
};

module.exports = {updatePassForm, updatePass};