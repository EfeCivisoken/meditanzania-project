const {
  Facility,
  SurveyResponse,
  QuestionResponse,
  Municipality,
  Region,
  District,
  Ward,
  FacilityScore,
  Post,
  User,
  QuestionCategory,
  sequelize
} = require('../models');

const { fn, col } = require('sequelize');

/**
 * Gets a list of all facilities.
 * @deprecated in favor of just using the search route for the list of facilities
 */
const listFacilities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const categories = await QuestionCategory.findAll();
    const { count, rows: facilities } = await Facility.findAndCountAll({
      include: [{
        model: Municipality,
        as: 'location',
        attributes: ['id', 'name']
      }],
      limit: pageSize,
      offset: offset
    });

    const facilityScores = await FacilityScore.findAll({
      attributes: [
        'facilityId',
        [sequelize.fn('MAX', sequelize.col('updatedAt')), 'latestUpdatedAt'],
        'score'
      ],
      where: {
        categoryId: 1
      },
      group: ['facilityId', 'score']
    });

    const facilitiesWithScores = facilities.map(facility => {
      const score = facilityScores.find(score => score.facilityId === facility.id)?.score || 0;
      return {
        id: facility.id,
        score: score
      };
    });

    let userType = null;

    if (req.isAuthenticated()) {
      userType = req.user.type;
    }

    const typeRows = await Facility.findAll({
      attributes: [[fn('DISTINCT', col('type')), 'type']],
      raw: true
    });

    const facilityTypes = typeRows.map(r => r.type);

    const regions = await Region.findAll();
    const districts = await District.findAll();
    const wards = await Ward.findAll();
    const municipalities = await Municipality.findAll();

    const userFacility = req.user ? await req.user.getFacility() : null;

    const totalPages = Math.ceil(count / pageSize);

    res.render('facility/facilities', {
      facilities: facilities,
      facilitiesWithScores,
      facilityTypes,
      regions,
      districts,
      wards,
      categories,
      municipalities: municipalities,
      userType: userType,
      userFacility: userFacility,
      compareFacilities: req.session.compareList ?? [],
      messages: {
        success: req.flash('success'),
        error: req.flash('error')
      },
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    req.flash('error', 'An error occurred while fetching facilities.');
    res.redirect('/');
  }
};

/**
 * Renders review data for a specific facility for citizens.
 * Route: GET /facilities/:id/citizen
 */
async function citizenFacilityView(req, res) {
  try {
    const facilityId = req.params.id;
    const facility = await Facility.findByPk(facilityId, {
      include: [{
        model: SurveyResponse,
        as: 'surveyResponses',
        include: {
          model: QuestionResponse,
          as: 'questionResponses'
        }
      }, {
        model: Municipality,
        as: 'location'
      }, {
        model: Post,
        as: 'posts',
        include: [{
          model: User,
          as: 'user',
          attributes: ['name']
        }],
        order: [
          ['createdAt', 'DESC']
        ]
      }]
    });

    if (!facility) {
      return res.status(404).send('Facility not found.');
    }

    // Compute summary info from survey responses (TODO: ADD DATA OTHERWISE IT WILL FAIL.)
    const reviews = facility.surveyResponses;
    const totalReviews = reviews.length;
    const avgRating = totalReviews ?
      reviews.reduce((acc, sr) => acc + (sr.overallRating || 0), 0) / totalReviews :
      0;

    const scores = await FacilityScore.findAll({
      where: {
        facilityId: facility.id,
      }
    });

    const filteredScores = scores.filter(score => score.categoryId !== 1 && score.categoryId !== null);
    const excludedScores = scores.filter(score => score.categoryId === 1 || score.categoryId === null);

    const sortedScores = excludedScores?.length > 0
      ? excludedScores.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      : [];

    const grouped = {};
    for (const s of filteredScores) {
      const catId = s.categoryId ?? 'Unknown';
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push({
        createdAt: s.createdAt,
        score: s.score
      });
    }

    const categoryNames = await QuestionCategory.findAll();
    const catIdToName = Object.fromEntries(categoryNames.map(c => [c.id, c.name]));

    const groupedScores = Object.entries(grouped).map(([categoryId, data]) => ({
      category: catIdToName[categoryId] || `Category ${categoryId}`,
      data: data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    }));

    // 1. Pull only overall scores (categoryId = 1) // Fix this if our design changes// along with each facility's district
    const allRes = await FacilityScore.findAll({
      where: { categoryId: 1 },                         // overall category
      include: [{ model: Facility, as: 'facility', include: [
        {
          model: Municipality, as: 'location'
        }
      ]}],
      attributes: ['score', 'createdAt']
    });

    // 2. Prepare accumulators for both overall and jurisdiction sums/counts
    const jur = facility.location.id;  // target district
    const sumsAll = {}, cntsAll = {}, sumsJur = {}, cntsJur = {};

    // 3. Bucket each record by month (YYYY-MM) and aggregate
    allRes.forEach(r => {
      const month = r.createdAt.toISOString().slice(0,7);  // bucket key
      const value = r.score || 0;                          // score value

      // overall aggregation
      sumsAll[month] = (sumsAll[month] || 0) + value;
      cntsAll[month] = (cntsAll[month] || 0) + 1;

      // jurisdiction-specific aggregation
      if (r.facility.location.id === jur) {
        sumsJur[month] = (sumsJur[month] || 0) + value;
        cntsJur[month] = (cntsJur[month] || 0) + 1;
      }
    });

    // 4. Build sorted list of all months seen
    const labels = Array.from(
      new Set([...Object.keys(sumsAll), ...Object.keys(sumsJur)])
    ).sort();

    // 5. Compute average for each month (or null if no data)
    const overallAvg = labels.map(month =>
      cntsAll[month]
        ? +(sumsAll[month]   / cntsAll[month]).toFixed(2)
        : null
    );
    const jurisdictionAvg = labels.map(month =>
      cntsJur[month]
        ? +(sumsJur[month]   / cntsJur[month]).toFixed(2)
        : null
    );

    // 6. Package for Chart.js
    const chartData = { labels, overallAvg, jurisdictionAvg };

    const regions = await Region.findAll();
    const districts = await District.findAll();
    const wards = await Ward.findAll();
    const municipalities = await Municipality.findAll();
    const categories = await QuestionCategory.findAll();

    res.render('facility/citizen', {
      facility,
      regions,
      districts,
      wards,
      municipalities,
      categories,
      messages: req.flash(),
      userType: req.user?.type ?? 'n/a',
      scores: sortedScores,
      groupedScores,
      summary: {
        averageRating: avgRating.toFixed(1),
        totalReviews
      },
      chartData
    });
  } catch (error) {
    console.error('Error loading facility view for citizens:', error);
    res.status(500).send('Failed to load facility view for citizens.');
  }
}

/**
 * Renders detailed review data for a specific facility for staff.
 * Route: GET /facilities/:id/staff
 */
async function staffFacilityView(req, res) {

  if (!req.isAuthenticated()) {
    res.redirect('/auth/login');
    req.flash('error', 'You need to be signed in to see this.');
    return;
  }

  if (req.user.type != 'facility-staff') {
    res.redirect('/auth/login');
    req.flash('error', 'You must be a staff member to see this page.');
    return;
  }

  try {
    const facilityId = req.params.id;
    const user = req.user; // Ensure your authentication middleware sets req.user

    const facility = await Facility.findByPk(facilityId, {
      include: [{
        model: SurveyResponse,
        as: 'surveyResponses',
        include: {
          model: QuestionResponse,
          as: 'questionResponses'
        }
      }, {
        model: Municipality,
        as: 'location'
      },
      {
        model: Post,
        as: 'posts',
        include: [{
          model: User,
          as: 'user',
          attributes: ['name']
        }],
        order: [
          ['createdAt', 'DESC']
        ]
      }
      ]
    });

    if (!facility) {
      return res.status(404).send('Facility not found.');
    }

    // Check that the user is authenticated and is a staff member.
    if (!user || user.type !== 'facility-staff') {
      return res.redirect(`/facilities/${req.params.id}/citizen`);
    }

    // Verify that the logged-in staff actually works at the requested facility.
    if (!user.worksAt || Number(user.worksAt) !== Number(facilityId)) {
      return res.redirect(`/facilities/${req.params.id}/citizen`);
    }

    // Compute summary info for convenience
    const reviews = facility.surveyResponses;
    const totalReviews = reviews.length;
    const avgRating = totalReviews ?
      reviews.reduce((acc, sr) => acc + (sr.overallRating || 0), 0) / totalReviews :
      0;

    const scores = await FacilityScore.findAll({
      where: {
        facilityId: facility.id,
      }
    });
  
    const filteredScores = scores.filter(score => score.categoryId !== 1 && score.categoryId !== null);
    const excludedScores = scores.filter(score => score.categoryId === 1 || score.categoryId === null);
  
    const sortedScores = excludedScores?.length > 0
      ? excludedScores.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      : [];
  
    const grouped = {};
    for (const s of filteredScores) {
      const catId = s.categoryId ?? 'Unknown';
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push({
        createdAt: s.createdAt,
        score: s.score
      });
    }
    
    const categoryNames = await QuestionCategory.findAll();
    const catIdToName = Object.fromEntries(categoryNames.map(c => [c.id, c.name]));
  
    const groupedScores = Object.entries(grouped).map(([categoryId, data]) => ({
      category: catIdToName[categoryId] || `Category ${categoryId}`,
      data: data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    }));

    // 1. Pull only overall scores (categoryId = 1) // Fix this if our design changes// along with each facility's district
    const allRes = await FacilityScore.findAll({
      where: { categoryId: 1 },                         // overall category
      include: [{ model: Facility, as: 'facility', include: [
        {
          model: Municipality, as: 'location'
        }
      ]}],
      attributes: ['score', 'createdAt']
    });

    // 2. Prepare accumulators for both overall and jurisdiction sums/counts
    const jur = facility.location.id;  // target district
    const sumsAll = {}, cntsAll = {}, sumsJur = {}, cntsJur = {};

    // 3. Bucket each record by month (YYYY-MM) and aggregate
    allRes.forEach(r => {
      const month = r.createdAt.toISOString().slice(0,7);  // bucket key
      const value = r.score || 0;                          // score value

      // overall aggregation
      sumsAll[month] = (sumsAll[month] || 0) + value;
      cntsAll[month] = (cntsAll[month] || 0) + 1;

      // jurisdiction-specific aggregation
      if (r.facility.location.id === jur) {
        sumsJur[month] = (sumsJur[month] || 0) + value;
        cntsJur[month] = (cntsJur[month] || 0) + 1;
      }
    });

    // 4. Build sorted list of all months seen
    const labels = Array.from(
      new Set([...Object.keys(sumsAll), ...Object.keys(sumsJur)])
    ).sort();

    // 5. Compute average for each month (or null if no data)
    const overallAvg = labels.map(month =>
      cntsAll[month]
        ? +(sumsAll[month]   / cntsAll[month]).toFixed(2)
        : null
    );
    const jurisdictionAvg = labels.map(month =>
      cntsJur[month]
        ? +(sumsJur[month]   / cntsJur[month]).toFixed(2)
        : null
    );

    // 6. Package for Chart.js
    const chartData = { labels, overallAvg, jurisdictionAvg };

    const regions = await Region.findAll();
    const districts = await District.findAll();
    const wards = await Ward.findAll();
    const municipalities = await Municipality.findAll();
    const categories = await QuestionCategory.findAll();

    res.render('facility/staff', {
      facility,
      regions,
      districts,
      wards,
      municipalities,
      categories,
      messages: req.flash(),
      scores: sortedScores,
      groupedScores,
      userType: req.user?.type ?? 'n/a',
      summary: {
        averageRating: avgRating.toFixed(1),
        totalReviews
      },
      chartData
    });
  } catch (error) {
    console.error('Error loading facility view for staff:', error);
    res.status(500).send('Failed to load facility view for staff.');
  }
}

/**
 * GET /facilities/:id
 * Decides automatically which facility view to render for the user
 */
const conditionalFacilityView = (req, res) => {

  if (!req.isAuthenticated()) {
    res.redirect(`/facilities/${req.params.id}/citizen`);
    return;
  }

  if (req.user.type == 'facility-staff') {
    res.redirect(`/facilities/${req.params.id}/staff`);
    return;
  }
  
  res.redirect(`/facilities/${req.params.id}/citizen`);
};

/**
 * Handles creation of a new post by facility staff.
 * Route: POST /facilityView/:id/post
 */
async function createPost(req, res) {
  try {

    if (!req.isAuthenticated()) {
      return res.status(403).send('Access denied. Only staff members can view this page.');
    }

    const facilityId = req.params.id;
    const user = req.user;

    // Only actual users who are actually STAFF can post
    if (!user || user.type !== 'facility-staff') {
      return res.status(403).send('Access denied. Only staff members can post updates.');
    }
    // Must work and must work at this specific facility
    if (!user.worksAt || Number(user.worksAt) !== Number(facilityId)) {
      return res.status(403).send('Access denied. You do not work at this facility.');
    }

    const {
      content
    } = req.body;
    // when trimmed it needs to have a content not allowing blank posts.
    if (!content || !content.trim()) {
      return res.status(400).send('Content is required.');
    }

    await Post.create({
      content,
      facilityId,
      userId: user.id
    });

    res.redirect(`/facilities/${facilityId}/staff`);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).send('Failed to create post.');
  }
}

module.exports = {
  listFacilities,
  citizenFacilityView,
  staffFacilityView,
  conditionalFacilityView,
  createPost
};