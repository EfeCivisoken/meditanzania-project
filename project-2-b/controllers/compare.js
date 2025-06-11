const { Facility, FacilityScore, Region, District, Ward, Municipality, QuestionCategory } = require('../models');

/**
 * POST /compare/add
 * Add a facility to the comparison list.
 */
const addFacility = (req, res) => {
  if(!req.body.facility || req.body.facility == '') {
    return res.sendStatus(400);
  }

  if(!req.session.compareList) {
    req.session.compareList = [];
  }

  if(!req.session.compareList.includes(req.body.facility)) {
    req.session.compareList.push(req.body.facility);
  }

  res.json({ success: true, compareList: req.session.compareList });
};

/**
 * POST /compare/remove
 * Remove a facility from the comparison list.
 */
const removeFacility = (req, res) => {
  if(!req.body.facility || req.body.facility == '') {
    return res.sendStatus(400);
  }
  
  req.session.compareList = (req.session.compareList || []).filter(id => id !== req.body.facility);
  res.json({ success: true });
};

/**
 * GET /compare/
 * Compare all facilities added to the list.
 */
const compare = async (req, res) => {

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  const ids = req.session.compareList || [];

  const facilities = await Facility.findAll({
    where: { id: ids },
    include: [{
      model: FacilityScore,
      as: 'scores',
      attributes: ['score'],
      where: { categoryId: 1 },
      order: [['createdAt', 'DESC']],
      limit: 1
    }]
  });

  const facilityScores = await facilities.reduce(async (accPromise, facility) => {
    const acc = await accPromise; // Resolve the accumulator promise
    const scores = await FacilityScore.findAll({
      where: { facilityId: facility.id, categoryId: 1 },
      attributes: ['score', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    acc[facility.id] = scores.map(score => ({
      score: score.score,
      createdAt: score.createdAt
    }));
    return acc;
  }, Promise.resolve({}));

  res.render('compare', { 
    messages: req.flash(),
    facilities,
    facilityScores,
    regions,
    districts,
    wards,
    municipalities,
    categories,
    userType: req.user?.type ?? null
  });
};

module.exports = {
  addFacility,
  removeFacility,
  compare
};