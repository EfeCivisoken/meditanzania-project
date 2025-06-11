/**
 * This controller holds all functions related to getting top n and low n performers given a jurisdiction.
 * URL: /toplown
 */
const fs = require("fs");
const { topNlowNByCatByJur } = require("../helpers/score");
const {
  Region,
  District,
  Ward,
  Municipality,
  QuestionCategory,
  UserJurisdiction
} = require("../models");

// ilovesyou
// /toplown/{body}

/**
 * GET /topnlown/:jurtype/:jurid/:catid/:n/
 * calls the views where it shows the options to look at top and low n facilities
 * and view the list if all values provided
 */
const topNLowN = async (req, res) => {
  // get param
  const { jur, catid, n } = req.query;

  // get jurisdiction type
  const prefixMap = { r: "region", d: "district", w: "ward" };
  let jurtype = prefixMap[jur.charAt(0)] || "municipality";

  // get jurisdiction id
  let jurid = jur.slice(2);

  // however, if jur = 'all', get all
  if (jur == "all") {
    jurtype = "all";
    jurid = "0";
  }

  // get the sorted lists of top n and low n
  const { topN, lowN } = await topNlowNByCatByJur(
    jurtype,
    // make sure to parse int values
    parseInt(jurid, 10),
    parseInt(catid, 10),
    parseInt(n, 10)
  );

  const regions = await Region.findAll();
  const districts = await District.findAll();
  const wards = await Ward.findAll();
  const municipalities = await Municipality.findAll();
  const categories = await QuestionCategory.findAll();

  // call template and send all necessary variables
  res.render("topn", {
    userType: req.user?.type ?? "n/a",
    compareFacilities: req.session.compareList ?? [],
    regions,
    districts,
    wards,
    municipalities,
    categories,
    topN,
    lowN,
    messages: req.flash(),
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    parameters: {
      jurtype,
      // make sure to parse int values
      jurid: parseInt(jurid, 10),
      catid: parseInt(catid, 10),
      n: parseInt(n, 10),
    },
    // pass parameters, helpful for dropdown
  });
};

/**
 * GET /topnlown/setup/
 * calls to check if authenticated and redirect page to the right one
 */
const goToTopNLowN = async (req, res) => {
  let { jur, catId, n } = {
    jur: null,
    catId: null,
    n: 5, // n =5 by default then you can use drop down to choose other number
  };

  // if authenticated, go to the endpoint for specific jurisdiction
  if (req.isAuthenticated() && (req.user.type == 'government-official' || req.user.type == 'public-offical')) {

    const jurisdiction = await UserJurisdiction.findOne({
      where: {
        userId: req.user.id
      }
    });

    if(!jurisdiction) {
      jur = "all";
    } else {
      let jType, id;

      if(jurisdiction.regionId) {
        jType = 'r';
        id = jurisdiction.regionId;
      } else if(jurisdiction.districtId) {
        jType = 'd';
        id = jurisdiction.districtId;
      } else if(jurisdiction.wardId) {
        jType = 'w';
        id = jurisdiction.wardId;
      } else {
        jType = 'm';
        id = jurisdiction.municipalityId;
      }

      jur = jType + '#' + id;

    }

    // get the right jurisdiction
    // =>TODO: get jurType and jurId
    console.log("HERE IS THE LUI ", req.user);
  } else {
    // if not authenticated, just give top and low on the whole country
    jur = "all";
  }

  // by default get category general
  // =>TODO: get id of category general which I think is 0
  catId = 1;

  // redirect to the right page now
  res.redirect(`/topnlown?jur=${jur}&catid=${catId}&n=${n}`);
  // url/endpoint?var1=fkslf&var2=jsdkfj
};

module.exports = { topNLowN, goToTopNLowN };
