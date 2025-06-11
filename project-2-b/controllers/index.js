const { default: axios } = require('axios');
const { Facility, SurveyResponse, FacilityScore, QuestionResponse, Municipality, Region, District, Ward, QuestionCategory } = require('../models');
const { Op } = require('sequelize');
const i18n = require('i18n');


/**
 * GET /
 * Dynamic index page
 */
const index = async (req, res) => {
  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  // Step 1: Fetch all facilities without scores
  const mapFacilitiesRaw = await Facility.findAll({
    attributes: ['id', 'name', 'longitude', 'latitude', 'municipalityId'],
    include: [{
      model: Municipality,
      as: 'location'
    }]
  });

  // Step 2: Fetch all scores for categoryId = 1, ordered by facilityId and createdAt
  const rawScores = await FacilityScore.findAll({
    where: { categoryId: 1 },
    attributes: ['facilityId', 'score', 'createdAt'],
    order: [['facilityId'], ['createdAt', 'DESC']]
  });

  // Step 3: Deduplicate to only one score per facility
  const latestScoresMap = new Map();
  for (const score of rawScores) {
    if (!latestScoresMap.has(score.facilityId)) {
      latestScoresMap.set(score.facilityId, score);
    }
  }

  // Step 4: Attach scores to facilities
  const mapFacilities = mapFacilitiesRaw.map(facility => {
    const score = latestScoresMap.get(facility.id);
    return {
      ...facility.toJSON(),
      latestScore: score ? score.score : null,
      scoreDate: score ? score.createdAt : null
    };
  });

  if(req.isAuthenticated() && req.user.worksAt) {
    try {
      const facility = await Facility.findByPk(req.user.worksAt, {
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
        }]
      });
    
      if (!facility) {
        return res.status(404).send('Facility not found.');
      }
    
      // Compute summary info for convenience
      const reviews = facility.surveyResponses;
      const totalReviews = reviews.length;
      const avgRating = totalReviews
        ? reviews.reduce((acc, sr) => acc + (sr.overallRating || 0), 0) / totalReviews
        : 0;

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
    
      res.render('index', {
        messages: {
          error: req.flash('error'),
          success: req.flash('success'),
        },
        facility,
        regions,
        districts,
        wards,
        municipalities,
        categories,
        scores: sortedScores,
        userType: req.user.type,
        summary: {
          averageRating: avgRating.toFixed(1),
          totalReviews
        },
        chartData,
        mapFacilities
      });
    } catch (error) {
      console.error('Error loading facility view for staff:', error);
      res.status(500).send('Failed to load facility view for staff.');
    }

    const facility = await req.user.getFacility();

    const scores = await FacilityScore.findAll({
      where: {
        facilityId: facility.id
      }
    });
    
    const sortedScores = scores.length > 0 
      ? scores.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) 
      : null;

    res.render('index', { 
      userType: req.user ? req.user.type : null, 
      user: req.isAuthenticated() ? req.user : null, 
      facility: facility,
      scores: sortedScores,
      messages: req.flash(),
      regions,
      districts,
      wards,
      municipalities,
      categories,
      mapFacilities
    });
    return;
  } else if (req.isAuthenticated() && (req.user.type == 'government-official' || req.user.type == 'public-official')) {
    // gov't official or public official
    let jurisdiction = null;
    try {
      jurisdiction = await req.user.getJurisdiction?.();
    } catch (err) {
      console.warn('Error getting jurisdiction:', err.message);
    }

    if (!jurisdiction || typeof jurisdiction !== 'object') {
      console.log('JURISDICTION NULL');
      res.render('index', { 
        userType: req.user ? req.user.type : null,
        user: req.isAuthenticated() ? req.user : null,
        anomalousFacilities: null,
        noJurisdiction: true,
        messages: req.flash(),
        regions,
        districts,
        wards,
        municipalities,
        categories,
        mapFacilities
      });
      return;
    }

    let allFacilities = [];
    let jurisdictionStr, jurisdictionType;

    if (await jurisdiction.getRegion() != null) {
      const r = await jurisdiction.getRegion();
      jurisdictionStr = r.name;
      jurisdictionType = i18n.__('common.region');
      const districts = await r.getDistricts();
      for (const d of districts) {
        const wards = await d.getWards();
        for (const w of wards) {
          const municipalities = await w.getMunicipalities();
          for (const m of municipalities) {
            const facilities = await m.getFacilities({
              include: [
                {
                  model: SurveyResponse,
                  as: 'surveyResponses',
                  include: [
                    {
                      model: QuestionResponse,
                      as: 'questionResponses'
                    }
                  ]
                }
              ]
            });
            allFacilities.push(...facilities);
          }
        }
      }
    } else if (await jurisdiction.getDistrict() != null) {
      const d = await jurisdiction.getDistrict();
      jurisdictionStr = d.name;
      jurisdictionType = i18n.__('common.district');
      const wards = await d.getWards();
      for (const w of wards) {
        const municipalities = await w.getMunicipalities();
        for (const m of municipalities) {
          const facilities = await m.getFacilities({
            include: [
              {
                model: SurveyResponse,
                as: 'surveyResponses',
                include: [
                  {
                    model: QuestionResponse,
                    as: 'questionResponses'
                  }
                ]
              }
            ]
          });
          allFacilities.push(...facilities);
        }
      }
    } else if (await jurisdiction.getWard() != null) {
      const w = await jurisdiction.getWard();
      jurisdictionStr = w.name;
      jurisdictionType = i18n.__('common.ward');
      const municipalities = await w.getMunicipalities();
      for (const m of municipalities) {
        const facilities = await m.getFacilities({
          include: [
            {
              model: SurveyResponse,
              as: 'surveyResponses',
              include: [
                {
                  model: QuestionResponse,
                  as: 'questionResponses'
                }
              ]
            }
          ]
        });
        allFacilities.push(...facilities);
      }
    } else if (await jurisdiction.getMunicipality() != null) {
      const m = await jurisdiction.getMunicipality();
      jurisdictionStr = m.name;
      jurisdictionType = i18n.__('common.municipality');
      const facilities = await m.getFacilities({
        include: [
          {
            model: SurveyResponse,
            as: 'surveyResponses',
            include: [
              {
                model: QuestionResponse,
                as: 'questionResponses'
              }
            ]
          }
        ]
      });
      allFacilities.push(...facilities);
    }

    

    const anomalies = await axios({
      method: 'post',
      url: 'http://127.0.0.1:5000/anomaly',
      data: allFacilities.reduce((acc, facility) => {
        acc[facility.id] = facility.surveyResponses.map((surveyResponse) => {
          const questionMap = {};
          surveyResponse.questionResponses.forEach((questionResponse) => {
            const value = questionResponse.responseInt ?? parseFloat(questionResponse.responseText);
            if (typeof value === 'number' && !isNaN(value)) {
              questionMap[`q${questionResponse.questionId}`] = value;
            }
          });
          return questionMap;
        });
        return acc;
      }, {})
    });

    const anomalousFacilities = await Promise.all(
      allFacilities
        .filter(f => anomalies.data.anomalous_facilities.includes(f.id))
        .map(async (facility) => {
          const scores = await FacilityScore.findAll({
            where: { facilityId: facility.id },
            attributes: ['score', 'createdAt'],
            order: [['createdAt', 'DESC']]
          });
          return {
            ...facility.toJSON(),
            scores: scores.map(score => ({
              score: score.score,
              date: score.createdAt
            }))
          };
        })
    );

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
    const sumsAll = {}, cntsAll = {}, sumsJur = {}, cntsJur = {};

    // 3. Bucket each record by month (YYYY-MM) and aggregate
    allRes.forEach(r => {
      const month = r.createdAt.toISOString().slice(0,7);  // bucket key
      const value = r.score || 0;                          // score value

      // overall aggregation
      sumsAll[month] = (sumsAll[month] || 0) + value;
      cntsAll[month] = (cntsAll[month] || 0) + 1;
    });

    for (const f of allFacilities) {
      const scores = await FacilityScore.findAll({
        where: { facilityId: f.id, categoryId: 1 },
        attributes: ['score', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });
    
      scores.forEach(s => {
        const month = s.createdAt.toISOString().slice(0,7);
        const value = s.score || 0;
        
        sumsJur[month] = (sumsJur[month] || 0) + value;
        cntsJur[month] = (cntsJur[month] || 0) + 1;
      });
    }

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


    res.render('index', { 
      userType: req.user ? req.user.type : null,
      user: req.isAuthenticated() ? req.user : null,
      facilities: allFacilities,
      jurisdiction: jurisdictionStr,
      jurisdictionType,
      noJurisdiction: false,
      messages: {
        error: req.flash('error'),
        success: req.flash('success'),
      },
      anomalousFacilities,
      regions,
      districts,
      wards,
      municipalities,
      categories,
      chartData,
      mapFacilities
    });
    return;
  }

  res.render('index', { 
    userType: req.user ? req.user.type : null,
    user: req.isAuthenticated() ? req.user : null,
    messages: {
      error: req.flash('error'),
      success: req.flash('success'),
    },
    regions,
    districts,
    wards,
    municipalities,
    categories,
    mapFacilities
  });
};

// New about controller function
const about = async (req, res) => {

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  let reviews = await SurveyResponse.count();

  reviews = reviews >= 1000 
    ? `${(Math.round(reviews / 500) / 2).toFixed(1).replace(/\.0$/, '')}k` 
    : reviews.toString();

  res.render('about', { 
    userType: req.user ? req.user.type : null, 
    user: req.isAuthenticated() ? req.user : null,
    regions,
    districts,
    wards,
    municipalities,
    categories,
    messages: req.flash(),
    reviews
  });
};

module.exports = { index, about };