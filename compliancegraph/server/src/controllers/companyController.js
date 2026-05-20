const { runQuery } = require('../config/neo4j');

// Onboard a new company and automatically assign applicable licenses
const onboardCompany = async (req, res, next) => {
  try {
    const { name, industryType, subIndustry, state, city, industrialZone, employeeCount, gstin, registeredAddress, phone } = req.body;
    const companyId = `CMP-${Date.now()}`;
    const firebaseUid = req.user.uid;

    await runQuery(`
      MERGE (c:Company {companyId: $companyId})
      SET c.name = $name,
          c.industryType = $industryType,
          c.subIndustry = $subIndustry,
          c.state = $state,
          c.city = $city,
          c.industrialZone = $industrialZone,
          c.employeeCount = $employeeCount,
          c.gstin = $gstin,
          c.registeredAddress = $registeredAddress,
          c.phone = $phone,
          c.firebaseUid = $firebaseUid,
          c.onboardedAt = datetime(),
          c.complianceScore = 1.0,
          c.subscriptionStatus = "trial"
    `, { companyId, name, industryType, subIndustry, state, city, industrialZone, employeeCount: parseInt(employeeCount), gstin, registeredAddress, phone, firebaseUid }, 'WRITE');

    // Auto-find applicable license types
    const licenseTypes = await runQuery(`
      MATCH (lt:LicenseType)
      WHERE $industryType IN lt.applicableTo
        AND ($state IN lt.applicableStates OR 'all' IN lt.applicableStates)
      RETURN lt
    `, { industryType, state });

    res.json({ companyId, applicableLicenseCount: licenseTypes.length, message: 'Company onboarded. Add your license details next.' });
  } catch (err) { next(err); }
};

const getCompany = async (req, res, next) => {
  try {
    const records = await runQuery(`
      MATCH (c:Company {firebaseUid: $uid})
      RETURN c
    `, { uid: req.user.uid });
    if (!records.length) return res.status(404).json({ error: 'Company not found' });
    res.json(records[0].get('c').properties);
  } catch (err) { next(err); }
};

const getComplianceScore = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const records = await runQuery(`
      MATCH (c:Company {companyId: $companyId})-[:HOLDS]->(l:License)
      WITH c,
        count(l) AS total,
        sum(CASE WHEN l.status = 'expired' THEN 1 ELSE 0 END) AS expired,
        sum(CASE WHEN l.daysToExpiry < 30 AND l.status = 'active' THEN 1 ELSE 0 END) AS critical
      SET c.complianceScore = round(1.0 - (toFloat(expired + critical * 0.5) / total), 2)
      RETURN c.complianceScore AS score, total, expired, critical
    `, { companyId }, 'WRITE');
    if (!records.length) return res.json({ score: 1.0, total: 0, expired: 0, critical: 0 });
    const row = records[0];
    res.json({
      score: row.get('score'),
      total: row.get('total').toNumber ? row.get('total').toNumber() : row.get('total'),
      expired: row.get('expired').toNumber ? row.get('expired').toNumber() : row.get('expired'),
      critical: row.get('critical').toNumber ? row.get('critical').toNumber() : row.get('critical'),
    });
  } catch (err) { next(err); }
};

module.exports = { onboardCompany, getCompany, getComplianceScore };
