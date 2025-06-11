'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

module.exports = {
  async up(queryInterface, Sequelize) {
    const filePath = path.join(__dirname, '..', 'data', 'clinics.csv');
    const rows = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ delimiter: ';', columns: true, skip_empty_lines: true }))
        .on('data', (data) => rows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    for (const row of rows) {
      const regionName = row['Region']?.replace(/\s*Region$/, '').trim();
      const districtName = row['District']?.replace(/\s*District$/, '').trim();
      const wardName = row['Ward']?.trim();
      const villageName = row['Village/Street']?.trim();

      if (!regionName || !districtName || !wardName || !villageName) {
        console.warn(`Skipping row (missing location): ${row['Facility Name']}`);
        continue;
      }

      // REGION
      let regionId = null;
      const regionRows = await queryInterface.sequelize.query(
        'SELECT id FROM "Regions" WHERE name = ? LIMIT 1',
        { replacements: [regionName], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (regionRows && regionRows.length > 0 && regionRows[0].id) {
        regionId = regionRows[0].id;
      } else {
        const now = new Date();
        await queryInterface.bulkInsert('Regions', [{ name: regionName, createdAt: now, updatedAt: now }]);
        const newRegionRows = await queryInterface.sequelize.query(
          'SELECT id FROM "Regions" WHERE name = ? LIMIT 1',
          { replacements: [regionName], type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        regionId = newRegionRows && newRegionRows.length > 0 ? newRegionRows[0].id : null;
      }

      // DISTRICT
      let districtId = null;
      const districtRows = await queryInterface.sequelize.query(
        'SELECT id FROM "Districts" WHERE name = ? AND "regionId" = ? LIMIT 1',
        { replacements: [districtName, regionId], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (districtRows && districtRows.length > 0 && districtRows[0].id) {
        districtId = districtRows[0].id;
      } else {
        const now = new Date();
        await queryInterface.bulkInsert('Districts', [{ name: districtName, regionId, createdAt: now, updatedAt: now }]);
        const newDistrictRows = await queryInterface.sequelize.query(
          'SELECT id FROM "Districts" WHERE name = ? AND "regionId" = ? LIMIT 1',
          { replacements: [districtName, regionId], type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        districtId = newDistrictRows && newDistrictRows.length > 0 ? newDistrictRows[0].id : null;
      }

      // WARD
      let wardId = null;
      const wardRows = await queryInterface.sequelize.query(
        'SELECT id FROM "Wards" WHERE name = ? AND "districtId" = ? LIMIT 1',
        { replacements: [wardName, districtId], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (wardRows && wardRows.length > 0 && wardRows[0].id) {
        wardId = wardRows[0].id;
      } else {
        const now = new Date();
        await queryInterface.bulkInsert('Wards', [{ name: wardName, districtId, createdAt: now, updatedAt: now }]);
        const newWardRows = await queryInterface.sequelize.query(
          'SELECT id FROM "Wards" WHERE name = ? AND "districtId" = ? LIMIT 1',
          { replacements: [wardName, districtId], type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        wardId = newWardRows && newWardRows.length > 0 ? newWardRows[0].id : null;
      }

      // MUNICIPALITY
      let municipalityId = null;
      const municipalityRows = await queryInterface.sequelize.query(
        'SELECT id FROM "Municipalities" WHERE name = ? AND "wardId" = ? LIMIT 1',
        { replacements: [villageName, wardId], type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (municipalityRows && municipalityRows.length > 0 && municipalityRows[0].id) {
        municipalityId = municipalityRows[0].id;
      } else {
        const now = new Date();
        await queryInterface.bulkInsert('Municipalities', [{ name: villageName, wardId, createdAt: now, updatedAt: now }]);
        const newMunicipalityRows = await queryInterface.sequelize.query(
          'SELECT id FROM "Municipalities" WHERE name = ? AND "wardId" = ? LIMIT 1',
          { replacements: [villageName, wardId], type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        municipalityId = newMunicipalityRows && newMunicipalityRows.length > 0 ? newMunicipalityRows[0].id : null;
      }

      // FACILITY
      const name = row['Facility Name'] || row['Common Name'] || 'Unnamed Facility';

      const facilityRows = await queryInterface.sequelize.query(
        'SELECT id FROM "Facilities" WHERE name = ? AND "municipalityId" = ? LIMIT 1',
        { replacements: [name, municipalityId], type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (facilityRows.length === 0) {
        const now = new Date();
        try {
          await queryInterface.bulkInsert('Facilities', [{
            name,
            commonName: row['Common Name'] || null,
            type: row['Facility Type'] || null,
            status: row['Operating Status']?.toLowerCase() === 'operating' ? 'active' : 'inactive',
            phoneNumber: row['Official Phone Number'] || null,
            address: row['PostalAddress'] || null,
            email: row['OfficialEmail'] || null,
            website: row['Website'] || null,
            longitude: isFinite(parseFloat(row['Longitude'])) ? parseFloat(row['Longitude']) : null,
            latitude: isFinite(parseFloat(row['Latitude'])) ? parseFloat(row['Latitude']) : null,
            municipalityId: municipalityId,
            createdAt: now,
            updatedAt: now
          }]);
          console.log(`Created facility: ${name}`);
        } catch (err) {
          console.error('Insert failed for:', name);
          console.error(err);
          throw err;
        }
      } else {
        console.log(`Skipped duplicate facility: ${name}`);
      }
    }

    console.log('Full facility + geography seed complete.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Facilities', null, {});
    await queryInterface.bulkDelete('Municipalities', null, {});
    await queryInterface.bulkDelete('Wards', null, {});
    await queryInterface.bulkDelete('Districts', null, {});
    await queryInterface.bulkDelete('Regions', null, {});
  }
};