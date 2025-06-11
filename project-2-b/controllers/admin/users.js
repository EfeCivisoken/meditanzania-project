const { User, Facility, Region, Ward, District, Municipality, UserJurisdiction, QuestionCategory } = require('../../models');
const bcrypt = require('bcrypt');

const listUsers = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  // User is an admin; get a list of all users to display.
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const users = await User.findAll({
    limit,
    offset
  });

  const totalUsers = await User.count();
  const totalPages = Math.ceil(totalUsers / limit);

  const facilities = await Facility.findAll();

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  res.render('admin/users', { 
    users,
    facilities,
    regions,
    districts,
    wards,
    municipalities,
    categories,
    page,
    totalPages,
    userType: req.user.type,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    }
  });
}; 

const createUser = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const name = req.body.name;
  const email = req.body.email;
  const pass = req.body.password;
  const type = req.body.type;
  const worksAt = req.body.worksAt;

  if (!name || !email || !pass || !type) {
    req.flash('error', 'All fields are required!');
    res.redirect('/admin/users');
    return;
  }

  try {
    const passHash = await bcrypt.hash(pass, 10);

    if(type == 'facility-staff') {
      await User.create({
        name: name,
        email: email,
        passwordHash: passHash,
        type: type,
        worksAt: worksAt
      });
    } else {
      await User.create({
        name: name,
        email: email,
        passwordHash: passHash,
        type: type
      });
    }
    req.flash('success', 'User created successfully!');
    res.redirect('/admin/users');
  } catch (e) {
    console.error('Error creating user: ', e);

    req.flash('error', 'An error occurred while creating the user. Make sure all fields are filled!');
    res.redirect('/admin/users');
  }
};

const viewUser = async (req, res) => {

  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const id = req.params.id;
  const user = await User.findOne({
    where: {
      id: id
    },
    include: [{ model: Facility, as: 'facility' }]
  });

  const facilities = await Facility.findAll();
  const regions = await Region.findAll();
  const wards = await Ward.findAll();
  const districts = await District.findAll();
  const municipalities = await Municipality.findAll();

  const jurisdiction = await UserJurisdiction.findOne({
    where: {
      userId: id
    }
  });

  if(!user) {
    res.sendStatus(404);
    // TODO: render 404 page?
    return;
  }

  const categories = await QuestionCategory.findAll();

  res.render('admin/user', { user: user, 
    userIsCurrentUser: user.id == req.user.id, 
    facilities: facilities,
    userType: req.user.type,
    regions,
    categories,
    wards,
    districts,
    municipalities,
    jurisdiction,
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    } });
};

/**
 * 
 * POST /admin/users/:id/jurisdiction 
 */
const setUserJurisdiction = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const id = req.params.id;
  const user = await User.findOne({
    where: {id}
  });

  if(!user) {
    res.redirect('/admin/');
    return;
  }

  const jurisdiction = await UserJurisdiction.findOne({
    where: {
      userId: id
    }
  });

  if(!req.body.region && !req.body.district && !req.body.ward && !req.body.municipality) {
    req.flash('error', 'You need to specify a region, district, ward, or municipality!');
    res.redirect(`/admin/users/${id}`);
    return;
  }

  if(req.body.region) {
    if(jurisdiction) {
      // the user already has a jurisdiction; update it.

      jurisdiction.regionId = req.body.region;
      jurisdiction.districtId = null;
      jurisdiction.wardId = null;
      jurisdiction.municipalityId = null;

      await jurisdiction.save();
      req.flash('success', 'Jurisdiction updated successfully.');
      res.redirect(`/admin/users/${id}`);
      return;
    } else {
      // need to create a new jurisdiction

      try {
        await UserJurisdiction.create({
          userId: id,
          regionId: req.body.region
        });
      } catch (e) {
        console.error('Exception: ' + e);
        req.flash('error', 'Failed to update jurisdiction.');
        res.redirect(`/admin/users/${id}`);
        return;
      }

      req.flash('success', 'Jurisdiction updated successfully.');
      res.redirect(`/admin/users/${id}`);
      return;

    }
  } else if(req.body.district) {
    if(jurisdiction) {
      // the user already has a jurisdiction; update it.

      jurisdiction.regionId = null;
      jurisdiction.districtId = req.body.district;
      jurisdiction.wardId = null;
      jurisdiction.municipalityId = null;

      await jurisdiction.save();
      req.flash('success', 'Jurisdiction updated successfully.');
      res.redirect(`/admin/users/${id}`);
      return;
    } else {
      // need to create a new jurisdiction

      try {
        await UserJurisdiction.create({
          userId: id,
          districtId: req.body.district
        });
      } catch (e) {
        console.error('Exception: ' + e);
        req.flash('error', 'Failed to update jurisdiction.');
        res.redirect(`/admin/users/${id}`);
        return;
      }

      req.flash('success', 'Jurisdiction updated successfully.');
      res.redirect(`/admin/users/${id}`);
      return;

    }
  } if(req.body.ward) {
    if(jurisdiction) {
      // the user already has a jurisdiction; update it.

      jurisdiction.regionId = null;
      jurisdiction.districtId = null;
      jurisdiction.wardId = req.body.ward;
      jurisdiction.municipalityId = null;

      await jurisdiction.save();
      req.flash('success', 'Jurisdiction updated successfully.');
      res.redirect(`/admin/users/${id}`);
      return;
    } else {
      // need to create a new jurisdiction

      try {
        await UserJurisdiction.create({
          userId: id,
          wardId: req.body.ward
        });
      } catch (e) {
        console.error('Exception: ' + e);
        req.flash('error', 'Failed to update jurisdiction.');
        res.redirect(`/admin/users/${id}`);
        return;
      }

      req.flash('success', 'Jurisdiction updated successfully.');
      res.redirect(`/admin/users/${id}`);
      return;

    }
  } if(req.body.municipality) {
    if(jurisdiction) {
      // the user already has a jurisdiction; update it.

      jurisdiction.regionId = null;
      jurisdiction.districtId = null;
      jurisdiction.wardId = null;
      jurisdiction.municipalityId = req.body.municipality;

      await jurisdiction.save();
      req.flash('success', 'Jurisdiction updated successfully.');
      res.redirect(`/admin/users/${id}`);
      return;
    } else {
      // need to create a new jurisdiction

      try {
        await UserJurisdiction.create({
          userId: id,
          municipalityId: req.body.municipality
        });
      } catch (e) {
        console.error('Exception: ' + e);
        req.flash('error', 'Failed to update jurisdiction.');
        res.redirect(`/admin/users/${id}`);
        return;
      }

      req.flash('success', 'Jurisdiction updated successfully.');
      res.redirect(`/admin/users/${id}`);
      return;
    }
  }
};

const updateUser = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  const name = req.body.name;
  const email = req.body.email;
  const pass = req.body.password;
  const type = req.body.type;
  const worksAt = req.body.facility;

  const user = await User.findOne({
    where: {
      id: req.params.id
    }
  });

  try {
    if(pass != '') {
      const passHash = await bcrypt.hash(pass, 10);
      user.passwordHash = passHash;
    }
    user.name = name;
    user.email = email;
    user.type = type;

    if(user.type == 'facility-staff') {
      user.worksAt = worksAt;
    }

    await user.save();
    req.flash('success', 'User updated successfully!');
    res.redirect(`/admin/users/${req.params.id}`);
  } catch (e) {
    console.error('Error creating user: ', e);

    req.flash('error', 'An error occurred while creating the user. Make sure all fields are filled!');
    res.redirect(`/admin/users/${req.params.id}`);
  }
};

const deleteUser = async (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be authenticated to view that page.');
    res.redirect('/auth/login');
    return;
  }

  if (req.user.type !== 'admin') {
    res.redirect('/');
    return;
  }

  if (req.user.id == req.params.id) {
    req.flash('error', 'Silly, silly! You can\'t delete yourself!');
    res.redirect(`/admin/users/${req.params.id}`);
    return;
  }

  const user = await User.findOne({
    where: {
      id: req.params.id
    }
  });

  await user.destroy();

  req.flash('success', 'User deleted.');
  res.redirect('/admin/users');
};

module.exports = { listUsers, createUser, viewUser, updateUser, deleteUser, setUserJurisdiction };