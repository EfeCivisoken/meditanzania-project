const { Facility, Municipality, FacilityScore, Region, Ward, District, QuestionCategory } = require('../../models');
const { calculateScore } = require('../../helpers/score');
const { Op } = require('sequelize');


const listFacilities = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;

    const { rows: facilities, count } = await Facility.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: Municipality,
          as: 'location',
          attributes: ['id', 'name']
        },
      ],
      order: [['id', 'ASC']]
    });

    const totalPages = Math.ceil(count / limit);

    var scoresDict = new Map();

    await Promise.all(facilities.map(async facility => {
      const scores = await FacilityScore.findAll({
        where: {
          facilityId: facility.id,
          [Op.or]: [
            { categoryId: 1 },
            { categoryId: null }
          ]
        }
      });
    
      const sortedScores = scores.length > 0 
        ? scores.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) 
        : null;

      scoresDict.set(facility.id, sortedScores);
    }));

    const regions = await Region.findAll();
    const districts = await District.findAll();
    const wards = await Ward.findAll();
    const municipalities = await Municipality.findAll(); 
    const categories = await QuestionCategory.findAll();

    res.render('admin/facilities', {
      facilities: facilities,
      scoresDict: scoresDict,
      municipalities: municipalities,
      regions,
      districts,
      wards,
      categories,
      userType: req.user.type,
      currentPage: page,
      totalPages: totalPages,
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      }
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    req.flash('error', 'An error occurred while fetching facilities.');
    res.redirect('/admin');
  }
};

/**
 * GET /admin/updatefacilityscores
 * Update facility scores, then redirect
 */
const updateScores = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  const facilities = await Facility.findAll();
  
  for (const facility of facilities) {
    const id = facility.id;
    const { overallScore, categoryScores } = await calculateScore(id);
  
    // Store overall score
    await FacilityScore.create({
      facilityId: id,
      score: overallScore,
      categoryId: 1
    });
  
    // Map category name to id and store each category score
    const surveyResponses = await facility.getSurveyResponses();
    const addedCategoryIds = new Set();
  
    for (const sr of surveyResponses) {
      const questionResponses = await sr.getQuestionResponses();
  
      for (const qr of questionResponses) {
        const question = await qr.getQuestion();
        const category = await question.getCategory();
  
        if (category && categoryScores[category.name] !== undefined && !addedCategoryIds.has(category.id)) {
          await FacilityScore.create({
            facilityId: id,
            score: categoryScores[category.name],
            categoryId: category.id
          });
  
          addedCategoryIds.add(category.id);
        }
      }
    }
  }

  req.flash('success', 'Updated scores!');
  res.redirect('/admin/facilities');
};

const createFacility = async (req, res) => {

  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  const { name, commonName, type, phone, address, email, website, location, longitude, latitude } = req.body;

  if (!name || !commonName || !type || !phone || !address || !email || !website || !location || !longitude || !latitude) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/admin/facilities');
  }

  try {
    await Facility.create({
      name,
      commonName,
      type,
      phoneNumber: phone,
      status: 'active',
      address,
      email,
      website,
      longitude,
      latitude,
      municipalityId: location
    });

    req.flash('success', 'Facility created successfully.');
    res.redirect('/admin/facilities');
  } catch (error) {
    console.error('Error creating facility:', error);
    req.flash('error', 'An error occurred while creating the facility.');
    res.redirect('/admin/facilities');
  }
};

const viewFacility = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  const facility = await Facility.findByPk(req.params.id, {
    include: [
      {
        model: Municipality,
        as: 'location',
        attributes: ['id', 'name']
      }
    ]
  });

  if(!facility) {
    res.sendStatus(404);
    return;
  }

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll(); 
  const categories = await QuestionCategory.findAll();
  const scores = await FacilityScore.findAll({
    where: {
      facilityId: facility.id,
      [Op.or]: [
        { categoryId: 1 },
        { categoryId: null }
      ]
    }
  });

  const sortedScores = scores.length > 0 
    ? scores.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) 
    : null;

  res.render('admin/facility', {
    facility: facility,
    municipalities: municipalities,
    scores: sortedScores,
    regions,
    districts,
    wards,
    categories,
    userType: req.user.type,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
};

const updateFacility = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  const id = req.params.id;
  const { name, commonName, type, phone, address, email, website, location, longitude, latitude } = req.body;

  if (!id || !name || !commonName || !type || !phone || !address || !email || !website || !location || !longitude || !latitude) {
    req.flash('error', 'All fields are required.');
    res.redirect(`/admin/facilities/${id}`);
    return;
  }

  try {
    const facility = await Facility.findByPk(id);

    if (!facility) {
      req.flash('error', 'Facility not found.');
      res.redirect(`/admin/facilities/${id}`);
      return;
    }

    await facility.update({
      name,
      commonName,
      type,
      phoneNumber: phone,
      status: facility.status,
      address,
      email,
      website,
      longitude,
      latitude,
      municipalityId: location
    });

    req.flash('success', 'Facility updated successfully.');
    res.redirect(`/admin/facilities/${id}`);
  } catch (error) {
    console.error('Error updating facility:', error);
    req.flash('error', 'An error occurred while updating the facility.');
    res.redirect(`/admin/facilities/${id}`);
  }
};

const activateFacility = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  const { id } = req.params;

  try {
    const facility = await Facility.findByPk(id, {
      include: [
        {
          model: Municipality,
          as: 'location',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!facility) {
      req.flash('error', 'Facility not found.');
      return res.redirect(`/admin/facilities/${id}`);
    }

    await facility.update({
      name: facility.name,
      commonName: facility.commonName,
      type: facility.type,
      phoneNumber: facility.phoneNumber,
      status: 'active',
      address: facility.address,
      email: facility.email,
      website: facility.website,
      municipalityId: facility.location.id
    });

    req.flash('success', 'Facility updated successfully.');
    res.redirect(`/admin/facilities/${id}`);
  } catch (error) {
    console.error('Error updating facility:', error);
    req.flash('error', 'An error occurred while updating the facility.');
    res.redirect(`/admin/facilities/${id}`);
  }
};

const deactivateFacility = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  const { id } = req.params;

  try {
    const facility = await Facility.findByPk(id, {
      include: [
        {
          model: Municipality,
          as: 'location',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!facility) {
      req.flash('error', 'Facility not found.');
      return res.redirect(`/admin/facilities/${id}`);
    }

    await facility.update({
      name: facility.name,
      commonName: facility.commonName,
      type: facility.type,
      phoneNumber: facility.phoneNumber,
      status: 'inactive',
      address: facility.address,
      email: facility.email,
      website: facility.website,
      municipalityId: facility.location.id
    });

    req.flash('success', 'Facility updated successfully.');
    res.redirect(`/admin/facilities/${id}`);
  } catch (error) {
    console.error('Error updating facility:', error);
    req.flash('error', 'An error occurred while updating the facility.');
    res.redirect(`/admin/facilities/${id}`);
  }
};

module.exports = { listFacilities, createFacility, viewFacility, updateFacility, activateFacility, deactivateFacility, updateScores };