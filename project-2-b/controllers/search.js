const { Facility, Region, District, Ward, Municipality, FacilityScore, QuestionCategory } = require('../models');
const { Op, col, fn } = require('sequelize');
const sequelize = require('sequelize');
const __ = require('i18n').__;

/**
 * GET /facilities?loc={r,d,w,m}#{id}&name={query}
 * Search for facilities
 */
const search = async (req, res) => {

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  const typeRows = await Facility.findAll({
    attributes: [[fn('DISTINCT', col('type')), 'type']],
    raw: true
  });

  const facilityTypes = typeRows.map(r => r.type);

  const pageSize = 10;
  const page = parseInt(req.query.page || '1');
  const categoryId = req.query.category || 1;

  if(!req.query.loc || req.query.loc == '') {

    if(!req.query.name || req.query.name == '') {
      // No location and no name — show all facilities
      let facilities = await Facility.findAll({
        include: [
          {
            model: Municipality,
            as: 'location'
          }
        ],
        order: []
      });

      if (categoryId) {
        await Promise.all(facilities.map(async facility => {
          facility.scores = await FacilityScore.findAll({
            where: {
              facilityId: facility.id,
              categoryId
            },
            limit: 1,
            order: [['createdAt', 'DESC']]
          });
          facility.score = facility.scores?.[0];
        }));

        facilities.sort((a, b) => {
          const aScore = a.scores?.[0]?.score ?? -Infinity;
          const bScore = b.scores?.[0]?.score ?? -Infinity;
          return bScore - aScore;
        });
      }

      const totalPages = Math.ceil(facilities.length / pageSize);
      facilities = facilities.slice((page - 1) * pageSize, page * pageSize);

      const preservedQuery = Object.entries(req.query)
        .filter(([key]) => key !== 'page')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      res.render('search', {
        facilities,
        facilityTypes,
        query: '""',
        locationName: '',
        locationType: `${__('search.noLoc')}`,
        location: '',
        noQuery: false,
        messages: {},
        regions,
        districts,
        wards,
        municipalities,
        categories,
        compareFacilities: req.session.compareList ?? [],
        categoryName: false,
        userType: req.user?.type ?? null,
        currentPage: page,
        totalPages,
        preservedQuery,
        selectedTypes: req.query.types ? [].concat(req.query.types) : [],
        categoryId,
      });
      return;
    }
    
    // no location, but we have a name to search with.

    let facilities = await Facility.findAll({
      where: {
        ...(req.query.types ? { type: { [Op.in]: [].concat(req.query.types) } } : {}),
        [Op.and]: [
          sequelize.where(
            sequelize.fn('lower', sequelize.col('Facility.name')),
            {
              [Op.like]: `%${req.query.name.toLowerCase()}%`
            }
          )
        ]
      },
      include: [
        {
          model: Municipality,
          as: 'location'
        }
      ],
      order: []
    });

    if (categoryId) {
      await Promise.all(facilities.map(async facility => {
        facility.scores = await FacilityScore.findAll({
          where: {
            facilityId: facility.id,
            categoryId
          },
          limit: 1,
          order: [['createdAt', 'DESC']]
        });
        facility.score = facility.scores?.[0];
      }));

      facilities.sort((a, b) => {
        const aScore = a.scores?.[0]?.score ?? -Infinity;
        const bScore = b.scores?.[0]?.score ?? -Infinity;
        return bScore - aScore;
      });
    }
    const totalPages = Math.ceil(facilities.length / pageSize);
    facilities = facilities.slice((page - 1) * pageSize, page * pageSize);

    const preservedQuery = Object.entries(req.query)
      .filter(([key]) => key !== 'page')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    res.render('search', {
      facilities,
      facilityTypes,
      query: `"${req.query.name}"`,
      locationName: '',
      locationType: `${__('search.noLoc')}`,
      location: '',
      noQuery: false,
      messages: {},
      regions,
      districts,
      wards,
      municipalities,
      categories,
      compareFacilities: req.session.compareList ?? [],
      categoryName: false,
      userType: req.user?.type ?? null,
      currentPage: page,
      totalPages,
      preservedQuery,
      selectedTypes: req.query.types ? [].concat(req.query.types) : [],
      categoryId,
    });


  } else {

    // dissect the location
    const split = req.query.loc.split('#');
    const locationType = split[0], locationId = split[1];

    // find the location
    let location;

    switch(locationType) {
    case 'r':
      location = await Region.findOne({
        where: {
          id: locationId
        }
      });
      break;
    case 'd':
      location = await District.findOne({
        where: {
          id: locationId
        }
      });
      break;
    case 'w':
      location = await Ward.findOne({
        where: {
          id: locationId
        }
      });
      break;
    case 'm':
      location = await Municipality.findOne({
        where: {
          id: locationId
        }
      });
      break;
    default:
      location = null;
      break;
    }

    // find all facilities in this location.

    let allFacilities = [];

    if(locationType == 'r') {
      const districts = await location.getDistricts();
      for (const d of districts) {
        const wards = await d.getWards();
        for (const w of wards) {
          const municipalities = await w.getMunicipalities();
          for (const m of municipalities) {
            const facilities = await m.getFacilities();
            allFacilities.push(...facilities);
          }
        }
      }
    } else if(locationType == 'd') {
      const wards = await location.getWards();
      for (const w of wards) {
        const municipalities = await w.getMunicipalities();
        for (const m of municipalities) {
          const facilities = await m.getFacilities();
          allFacilities.push(...facilities);
        }
      }
    } else if(locationType == 'w') {
      const municipalities = await location.getMunicipalities();
      for (const m of municipalities) {
        const facilities = await m.getFacilities();
        allFacilities.push(...facilities);
      }
    } else if (locationType == 'm') {
      const facilities = await location.getFacilities();
      allFacilities.push(...facilities);
    }

    // Re-fetch facilities with their location associations
    const facilityIds = allFacilities.map(facility => facility.id);
    allFacilities = await Facility.findAll({
      where: { id: facilityIds },
      include: [
        { model: Municipality, as: 'location' }
      ]
    });
    if (req.query.types) {
      const selectedTypes = [].concat(req.query.types);
      allFacilities = allFacilities.filter(facility =>
        selectedTypes.includes(facility.type)
      );
    }

    if(!req.query.name || req.query.name == '') {
      // Only a location to search with.

      if(!location) {
        const preservedQuery = Object.entries(req.query)
          .filter(([key]) => key !== 'page')
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        res.render('search', {
          noQuery: true,
          messages: {
            error: 'Invalid location specified, with no query.'
          },
          regions,
          facilities: [],
          facilityTypes,
          districts,
          wards,
          municipalities,
          categories,
          compareFacilities: req.session.compareList ?? [],
          categoryName: false,
          userType: req.user?.type ?? null,
          currentPage: 1,
          totalPages: 0,
          preservedQuery,
          location: `${locationType}#${locationId}`,
          selectedTypes: req.query.types ? [].concat(req.query.types) : [],
          categoryId,
        });
        return;
      }

      let categoryName = await QuestionCategory.findOne({
        where: {
          id: categoryId
        }
      });
      categoryName = categoryName.name;
      if (categoryId) {
        await Promise.all(allFacilities.map(async facility => {
          facility.scores = await FacilityScore.findAll({
            where: {
              facilityId: facility.id,
              categoryId
            },
            limit: 1,
            order: [['createdAt', 'DESC']]
          });
          facility.score = facility.scores?.[0];
        }));

        allFacilities.sort((a, b) => {
          const aScore = a.scores?.[0]?.score ?? -Infinity;
          const bScore = b.scores?.[0]?.score ?? -Infinity;
          return bScore - aScore;
        });
      }

      const totalPages = Math.ceil(allFacilities.length / pageSize);
      const pagedFacilities = allFacilities.slice((page - 1) * pageSize, page * pageSize);

      const preservedQuery = Object.entries(req.query)
        .filter(([key]) => key !== 'page')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      res.render('search', {
        facilities: pagedFacilities,
        facilityTypes,
        query: '""',
        locationName: location ? location.name : 'Unknown',
        locationType: locationType === 'r' ? 'Region' :
          locationType === 'd' ? 'District' :
            locationType === 'w' ? 'Ward' :
              locationType === 'm' ? 'Municipality' : 'Unknown',
        location: `${locationType}#${locationId}`,
        noQuery: false,
        messages: {},
        regions,
        districts,
        wards,
        municipalities,
        categories,
        categoryName,
        compareFacilities: req.session.compareList ?? [],
        userType: req.user?.type ?? null,
        currentPage: page,
        totalPages,
        preservedQuery,
        selectedTypes: req.query.types ? [].concat(req.query.types) : [],
        categoryId,
      });
      return;
    }
    
    // both name and location to search
    // find facilities \in name \cap facilities \in location

    let filteredFacilities = allFacilities.filter(facility =>
      facility.name.toLowerCase().includes(req.query.name.toLowerCase())
    );

    // Re-fetch filtered facilities with their location associations
    const filteredFacilityIds = filteredFacilities.map(facility => facility.id);
    filteredFacilities = await Facility.findAll({
      where: {
        id: filteredFacilityIds,
        ...(req.query.types ? { type: { [Op.in]: [].concat(req.query.types) } } : {})
      },
      include: [
        { model: Municipality, as: 'location' }
      ]
    });

    let categoryName = await QuestionCategory.findOne({
      where: {
        id: categoryId
      }
    });
    categoryName = categoryName.name;
    if (categoryId) {
      await Promise.all(filteredFacilities.map(async facility => {
        facility.scores = await FacilityScore.findAll({
          where: {
            facilityId: facility.id,
            categoryId
          },
          limit: 1,
          order: [['createdAt', 'DESC']]
        });
        facility.score = facility.scores?.[0];
      }));

      filteredFacilities.sort((a, b) => {
        const aScore = a.scores?.[0]?.score ?? -Infinity;
        const bScore = b.scores?.[0]?.score ?? -Infinity;
        return bScore - aScore;
      });
    }

    const totalPages = Math.ceil(filteredFacilities.length / pageSize);
    filteredFacilities = filteredFacilities.slice((page - 1) * pageSize, page * pageSize);

    const preservedQuery = Object.entries(req.query)
      .filter(([key]) => key !== 'page')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    res.render('search', {
      facilities: filteredFacilities,
      facilityTypes,
      query: `"${req.query.name}"`,
      locationName: location ? location.name : 'Unknown',
      locationType: locationType === 'r' ? 'Region' :
        locationType === 'd' ? 'District' :
          locationType === 'w' ? 'Ward' :
            locationType === 'm' ? 'Municipality' : 'Unknown',
      location: `${locationType}#${locationId}`,
      noQuery: false,
      messages: {},
      regions,
      districts,
      wards,
      municipalities,
      categories,
      compareFacilities: req.session.compareList ?? [],
      categoryName,
      userType: req.user?.type ?? null,
      currentPage: page,
      totalPages,
      preservedQuery,
      selectedTypes: req.query.types ? [].concat(req.query.types) : [],
      categoryId,
    });

  }
};

module.exports = { search };