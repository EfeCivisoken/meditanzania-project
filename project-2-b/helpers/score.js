const { Facility, FacilityScore } = require("../models");
const { getFacilitiesByJurisdiction } = require("./facility");
const axios = require("axios");
const { Op } = require("sequelize");

/**
 * Calculates the score for a set of responses.
 * @param {number} facilityId the facility id to calculate the score for.
 * @returns a float between 0.000 and 5.000
 */
const calculateScore = async (facilityId) => {
  const facility = await Facility.findByPk(facilityId);
  if (!facility)
    throw new Error(`Facility with id ${facilityId} does not exist.`);

  const surveyResponses = await facility.getSurveyResponses();
  let score = 0;
  let maxPossibleScore = 0; // to normalize responses

  const categoryScores = {}; // { [categoryName]: { score: number, max: number } }

  for (const sr of surveyResponses) {
    const questionResponses = await sr.getQuestionResponses();

    for (const qr of questionResponses) {
      const question = await qr.getQuestion();
      const weight = question.weight;
      const category = await question.getCategory();

      if (question.textResponse) {
        // Make a POST request to 127.0.0.1:5000/sentiment
        // TODO: Make the URL and port of the Flask server configurable
        const response = await axios({
          method: "post",
          url: "http://127.0.0.1:5000/sentiment",
          data: {
            text: question.responseText,
          },
        });

        let transformed = response.class == "negative" ? -1 : 1;
        let maxTransformed = 5;

        switch (question.transformation) {
          case "square":
            transformed = Math.pow(transformed, 2);
            maxTransformed = Math.pow(5, 2);
            break;
          case "sqrt":
            transformed = Math.sqrt(transformed);
            maxTransformed = Math.sqrt(5);
            break;
          case "inverse":
            transformed = rawResponse === 0 ? 0 : 1 / transformed;
            maxTransformed = 1 / 1; // smallest nonzero response assumed to be 1
            break;
          case "none":
          default:
            // use rawResponse and maxTransformed as is
            break;
        }

        score += transformed * weight;
        maxPossibleScore += maxTransformed * weight;
        continue;
      }

      const rawResponse = parseFloat(qr.responseInt);
      if (isNaN(rawResponse)) continue; // Skip invalid numeric input

      let transformed = rawResponse;
      let maxTransformed = 5;

      switch (question.transformation) {
        case "square":
          transformed = Math.pow(rawResponse, 2);
          maxTransformed = Math.pow(5, 2);
          break;
        case "sqrt":
          transformed = Math.sqrt(rawResponse);
          maxTransformed = Math.sqrt(5);
          break;
        case "inverse":
          transformed = rawResponse === 0 ? 0 : 1 / rawResponse;
          maxTransformed = 1 / 1; // smallest nonzero response assumed to be 1
          break;
        case "none":
        default:
          // use rawResponse and maxTransformed as is
          break;
      }

      score += transformed * weight;
      maxPossibleScore += maxTransformed * weight;

      // Only update category score if category exists
      if (category && category.id != 1) {
        const categoryName = category.name;
        if (!categoryScores[categoryName]) {
          categoryScores[categoryName] = { score: 0, max: 0 };
        }

        categoryScores[categoryName].score += transformed * weight;
        categoryScores[categoryName].max += maxTransformed * weight;
      }
    }
  }

  const overallScore =
    maxPossibleScore === 0
      ? 0.0
      : parseFloat(((score / maxPossibleScore) * 5).toFixed(3));

  const categoryNormalized = {};
  for (const [cat, { score, max }] of Object.entries(categoryScores)) {
    categoryNormalized[cat] =
      max === 0 ? 0.0 : parseFloat(((score / max) * 5).toFixed(3));
  }

  return {
    overallScore,
    categoryScores: categoryNormalized,
  };
};

/**
 * Get the score for a set of facilities.
 * @param {Array} facilities list of facilities to get score for
 * @param {number} categoryId id of the category we are interested in
 * @returns a list of facilities with their category score
 */
const getScoreByCategoryFromList = async (facilities, categoryId) => {
  let facilityList = facilities;

  // map the facility array to an array of ids
  const facilityIds = facilities.map((facility) => facility.id);

  // get the category score for each facility
  const facilityScores = await FacilityScore.findAll({
    where: {
      facilityId: { [Op.in]: facilityIds }, // Op.in here to to check if the value is in facilityIds
      categoryId: categoryId,
    },
  });

  // now combine the two list
  // create a map for quick lookup
  const scoreMap = {};
  facilityScores.forEach((score) => {
    scoreMap[score.facilityId] = score.score; // adjust `score.score` if the field name is different
  });

  // attach scores to facilities
  facilityList.forEach((facility) => {
    facility.score = scoreMap[facility.id] || null; // default to null if not found
  });

  return facilityList;
};

/**
 * Get the score for a set of facilities.
 * @param {Array} facilities [{facility:value, score:value}]
 * @param {number} n the n number in top n and low n
 * @returns //{topN:[{facility:value, score:value},...], lowN:[{facility:value, score:value},...]}
 */
const getTopNLowNFromList = (facilities, n) => {
  // Sort facilities in descending order by score
  const sorted = [...facilities].sort((a, b) => b.score - a.score);

  // get top n and bottom n
  // if the list has length n or longer, we can slice
  // if not, both list are going to be the same with order reversed
  const topN = sorted.length >= n ? sorted.slice(0, n) : sorted;
  const lowN =
    sorted.length >= n ? sorted.slice(-n) : sorted;

  return { topN, lowN };
};

/**
 * Get the score for a set of facilities by jurisdiction.
 * @param {string} jurisdictionType accepts "region" || "district" || "ward" || "municipality"
 * @param {number} jurisdictionId
 * @param {number} categoryId the category id of interest
 * @param {number} n the n number in top n and low n
 * @returns a sorted list of facilities with their category score
 */
const topNlowNByCatByJur = async (
  jurisdictionType,
  jurisdictionId,
  categoryId,
  n
) => {
  // get all the facilities in this jurisdiction
  const facilities = await getFacilitiesByJurisdiction(
    jurisdictionType,
    jurisdictionId
  );

  // get the category score for each facility
  const facilitiesScores = await getScoreByCategoryFromList(
    facilities,
    categoryId
  );

  // sort top n and bottom n
  const topNLowN = getTopNLowNFromList(facilitiesScores, n);

  return topNLowN;
};

module.exports = { calculateScore, topNlowNByCatByJur };
