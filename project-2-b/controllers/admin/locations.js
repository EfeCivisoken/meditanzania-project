const { Region, Ward, District, Municipality, QuestionCategory } = require('../../models');

/**
 * GET /admin/locations
 * Lists all regions, districts, wards, and municipalities
 */
const listLocations = async (req, res) => {
  if(!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if(req.user.type != 'admin') {
    res.redirect('/auth/login');
    return;
  }

  // Pagination variables
  const pageSize = 25;
  const pageRegions = parseInt(req.query.pageRegions) || 1;
  const pageDistricts = parseInt(req.query.pageDistricts) || 1;
  const pageWards = parseInt(req.query.pageWards) || 1;
  const pageMunicipalities = parseInt(req.query.pageMunicipalities) || 1;
  const activeTab = req.query.tab || 'regions';

  const [regionsData, districtsData, wardsData, municipalitiesData, categories] = await Promise.all([
    Region.findAndCountAll({
      limit: pageSize,
      offset: (pageRegions - 1) * pageSize
    }),
    District.findAndCountAll({
      include: [{ model: Region, as: 'region' }],
      limit: pageSize,
      offset: (pageDistricts - 1) * pageSize
    }),
    Ward.findAndCountAll({
      include: [{ model: District, as: 'district' }],
      limit: pageSize,
      offset: (pageWards - 1) * pageSize
    }),
    Municipality.findAndCountAll({
      include: [{ model: Ward, as: 'ward' }],
      limit: pageSize,
      offset: (pageMunicipalities - 1) * pageSize
    }),
    QuestionCategory.findAll()
  ]);

  const wards = wardsData.rows.filter(ward =>
    ward &&
    typeof ward.id === 'number' &&
    typeof ward.name === 'string' &&
    ward.name.length < 1000
  );

  res.render('admin/locations', {
    regions: regionsData.rows,
    districts: districtsData.rows,
    wards,
    municipalities: municipalitiesData.rows,
    categories,
    pagination: {
      regions: {
        current: pageRegions,
        total: Math.ceil(regionsData.count / pageSize)
      },
      districts: {
        current: pageDistricts,
        total: Math.ceil(districtsData.count / pageSize)
      },
      wards: {
        current: pageWards,
        total: Math.ceil(wardsData.count / pageSize)
      },
      municipalities: {
        current: pageMunicipalities,
        total: Math.ceil(municipalitiesData.count / pageSize)
      }
    },
    messages: {
      success: req.flash('success'),
      error: req.flash('error')
    },
    userType: req.user.type,
    activeTab
  });
};

/**
 * POST /admin/locations/{regions, districts, wards, municipalities}/create
 * Create a new location
 */
const createLocation = async (req, res, locationType) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/auth/login');
    return;
  }

  if (!['Region', 'District', 'Ward', 'Municipality'].includes(locationType)) {
    req.flash('error', 'Invalid location type.');
    res.redirect('/admin/locations');
    return;
  }

  if (!req.body.name || req.body.name.trim() === '') {
    req.flash('error', 'Name is required.');
    res.redirect('/admin/locations');
    return;
  }

  // Map string to actual model
  const modelMap = { Region, District, Ward, Municipality };
  const Model = modelMap[locationType];

  try {
    const instance = await Model.create({ name: req.body.name.trim() });

    switch(locationType) {
    case 'District':
      if(!req.body.region || req.body.region == '') {
        req.flash('error', 'expected region id');
        res.redirect('/admin/locations');
        return;
      }
  
      instance.regionId = req.body.region;
      break;
    case 'Ward':
      if(!req.body.district || req.body.district == '') {
        req.flash('error', 'expected district id');
        res.redirect('/admin/locations');
        return;
      }
    
      instance.districtId = req.body.district;
      break;
    case 'Municipality':
      if(!req.body.ward || req.body.ward == '') {
        req.flash('error', 'expected ward id');
        res.redirect('/admin/locations');
        return;
      }
      
      instance.wardId = req.body.ward;
      break;
    }

    await instance.save();
      
    req.flash('success', `${locationType} created successfully.`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while creating the location.');
  }

  res.redirect('/admin/locations');
};

/**
 * POST /admin/locations/{regions, districts, wards, municipalities}/:id/update
 * Update a location
 */
const updateLocation = async (req, res, locationType) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/auth/login');
    return;
  }

  if (!['Region', 'District', 'Ward', 'Municipality'].includes(locationType)) {
    req.flash('error', 'Invalid location type.');
    res.redirect('/admin/locations');
    return;
  }

  if (!req.body.name || req.body.name.trim() === '') {
    req.flash('error', 'Name is required.');
    res.redirect('/admin/locations');
    return;
  }

  // Map string to actual model
  const modelMap = { Region, District, Ward, Municipality };
  const Model = modelMap[locationType];

  try {
    const instance = await Model.findOne({ where: { id: req.params.id } });

    if(!instance) {
      req.flash('error', 'Couldn\'t find a location for that id.');
      res.redirect('/admin/locations');
      return;
    }

    switch(locationType) {
    case 'District':
      if(!req.body.region || req.body.region == '') {
        req.flash('error', 'expected region id');
        res.redirect('/admin/locations');
        return;
      }

      instance.regionId = req.body.region;
      break;
    case 'Ward':
      if(!req.body.district || req.body.district == '') {
        req.flash('error', 'expected district id');
        res.redirect('/admin/locations');
        return;
      }
  
      instance.districtId = req.body.district;
      break;
    case 'Municipality':
      if(!req.body.ward || req.body.ward == '') {
        req.flash('error', 'expected ward id');
        res.redirect('/admin/locations');
        return;
      }
    
      instance.wardId = req.body.ward;
      break;
    }

    instance.name = req.body.name;

    await instance.save();

    req.flash('success', `${locationType} updated successfully.`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while updating the location.');
  }

  res.redirect('/admin/locations');
};

/**
 * GET /admin/locations/{regions, districts, wards, municipalities}/:id/delete
 * Delete a location
 */
const deleteLocation = async (req, res, locationType) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/auth/login');
    return;
  }

  if (!['Region', 'District', 'Ward', 'Municipality'].includes(locationType)) {
    req.flash('error', 'Invalid location type.');
    res.redirect('/admin/locations');
    return;
  }

  // Map string to actual model
  const modelMap = { Region, District, Ward, Municipality };
  const Model = modelMap[locationType];

  try {
    const instance = await Model.findOne({ where: { id: req.params.id } });

    if(!instance) {
      req.flash('error', 'Couldn\'t find a location for that id.');
      res.redirect('/admin/locations');
      return;
    }

    await instance.destroy();

    req.flash('success', `${locationType} deleted successfully.`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while deleting the location.');
  }

  res.redirect('/admin/locations');
};



module.exports = { listLocations, createLocation, updateLocation, deleteLocation };