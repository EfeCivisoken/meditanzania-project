const { Facility, Municipality, Ward, District } = require("../models");
const { Op } = require("sequelize");

/**
 * Get the list of municipalities in this jurisdiction
 * @param {string} jurisdictionType accepts "region" || "district" || "ward" || "municipality"
 * @param {number} jurisdictionId
 * @returns
 */
const getMunicipalitiesByJurisdiction = async (
  jurisdictionType,
  jurisdictionId
) => {
  // variables to use later
  let districts = [];
  let wards = [];
  let municipalities = [];

  // get a list of all municipalities in this jurisdiction
  switch (jurisdictionType) {
    case "municipality": {
      // if municipality, just add it to the list
      const m = await Municipality.findByPk(jurisdictionId);
      if (m) municipalities.push(m);
      break;
    }

    case "ward":
      //get all municipalities in the ward
      municipalities = await Municipality.findAll({
        where: { wardId: jurisdictionId },
      });
      break;

    case "district":
      // get all wards in the district
      wards = await Ward.findAll({
        where: { districtId: jurisdictionId },
      });

      // get all municipalities in the ward list
      municipalities = Municipality.findAll({
        where: { wardId: { [Op.in]: wards.map((w) => w.id) } },
      });
      break;

    case "region":
      // get all districts in the region
      districts = await District.findAll({
        where: { regionId: jurisdictionId },
      });

      // get all wards in the district
      wards = await Ward.findAll({
        where: { districtId: { [Op.in]: districts.map((d) => d.id) } },
      });

      // get all municipalities in the ward list
      municipalities = Municipality.findAll({
        where: { wardId: { [Op.in]: wards.map((w) => w.id) } },
      });
      break;

    default:
      // if none of the above, return empty array
      return [];
  }

  return municipalities;
};

/**
 * Get the facilities in this jurisdiction
 * @param {string} jurisdictionType accepts "region" || "district" || "ward" || "municipality"
 * @param {number} jurisdictionId
 * @returns a list of facilities in this jurisdiction
 */
const getFacilitiesByJurisdiction = async (
  jurisdictionType,
  jurisdictionId
) => {
  // if the client is asking for all facilities, get all
  if (jurisdictionType == "all") {
    let ret = await Facility.findAll({
      include: [
        {
          model: Municipality,
          as: "location",
        },
      ],
    });

    return ret;
  }

  // get a list of all municipalities in this jurisdiction
  let municipalities = await getMunicipalitiesByJurisdiction(
    jurisdictionType,
    jurisdictionId
  );

  // get all the facilities in this jurisdiction
  const facilities = await Facility.findAll({
    where: { municipalityId: { [Op.in]: municipalities.map((m) => m.id) } },
    include: [
      {
        model: Municipality,
        as: "location",
      },
    ],
    // attributes: ['id', 'name'],
  });

  return facilities;
};

module.exports = { getFacilitiesByJurisdiction };
