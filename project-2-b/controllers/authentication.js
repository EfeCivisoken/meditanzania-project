const { Region, District, Ward, Municipality, QuestionCategory } = require('../models');

/**
 * Holds authentication-related routes
 * 
 * @file
 */

/**
 * Display login form, allow users to submit POST requests to /login.
 */
async function getLogin(req, res) {

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  res.render('auth/login', { messages: req.flash(), 
    userType: null,
    regions,
    districts,
    wards,
    municipalities,
    categories
  });
}

/**
 * Logs a user out of the system.
 */
function logout(req, res) {
  req.logout(() => res.redirect('/'));
}

module.exports = {
  getLogin,
  logout
};