const { Region, District, Ward, Municipality, QuestionCategory } = require('../../models');

const viewPanel = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  res.render('admin/index', {
    userName: req.user.name,
    userType: req.user.type,
    regions,
    districts,
    wards,
    municipalities,
    categories,
    messages: req.flash()
  });
};

module.exports = { viewPanel };