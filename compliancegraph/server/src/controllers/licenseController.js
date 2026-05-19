const { runQuery } = require('../config/neo4j');

const addLicense = async (req, res, next) => {
  try {
    const { companyId, licenseTypeId, licenseNumber, issueDate, expiryDate, notes } = req.body;
    const licenseId = `LIC-${companyId}-${Date.now()}`;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    const status = daysToExpiry < 0 ? 'expired' : daysToExpiry < 30 ? 'pending_renewal' : 'active';

    // Map human readable names or ID strings from client
    let finalTypeId = licenseTypeId;
    let licenseTypeName = licenseTypeId;

    const seededIds = [
      "FACTORY_LICENSE_TG", "PCB_CTE_TG", "PCB_CTO_TG", "FIRE_NOC_TG",
      "DRUG_MFG_FORM25", "GST_RETURNS", "HAZ_WASTE_AUTH"
    ];

    if (!seededIds.includes(licenseTypeId)) {
      // Map friendly names of seeded licenses to their correct IDs
      if (licenseTypeId === "Factory License") {
        finalTypeId = "FACTORY_LICENSE_TG";
        licenseTypeName = "Factory License";
      } else if (licenseTypeId === "Fire NOC") {
        finalTypeId = "FIRE_NOC_TG";
        licenseTypeName = "Fire Safety NOC";
      } else if (licenseTypeId === "GST Registration") {
        finalTypeId = "GST_RETURNS";
        licenseTypeName = "GST Monthly Returns";
      } else if (licenseTypeId === "Pollution Control Consent") {
        finalTypeId = "PCB_CTO_TG";
        licenseTypeName = "PCB Consent to Operate";
      } else {
        // It's a completely new custom license type. Standardize the type ID.
        finalTypeId = licenseTypeId.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      }
    }

    // Merge the license type to guarantee it exists in Neo4j, then create and link the license
    await runQuery(`
      MATCH (c:Company {companyId: $companyId})
      MERGE (lt:LicenseType {licenseTypeId: $finalTypeId})
      ON CREATE SET lt.name = $licenseTypeName,
                    lt.shortCode = $finalTypeId,
                    lt.applicableTo = ["pharma", "chemical", "food", "textile", "manufacturing"],
                    lt.applicableStates = ["all"],
                    lt.validityMonths = 12,
                    lt.renewalLeadDays = 30,
                    lt.penaltyDescription = "Standard regulatory compliance fine and operational warnings",
                    lt.penaltySeverity = "medium",
                    lt.governingAct = "Regulatory Compliance Guidelines",
                    lt.requiresPhysicalInspection = false
      
      CREATE (l:License {
        licenseId: $licenseId,
        licenseNumber: $licenseNumber,
        issueDate: date($issueDate),
        expiryDate: date($expiryDate),
        daysToExpiry: $daysToExpiry,
        status: $status,
        riskScore: $riskScore,
        notes: $notes,
        createdAt: datetime()
      })
      CREATE (c)-[:HOLDS {since: date($issueDate)}]->(l)
      CREATE (l)-[:IS_TYPE_OF]->(lt)
    `, {
      companyId, finalTypeId, licenseTypeName, licenseId, licenseNumber,
      issueDate, expiryDate, daysToExpiry,
      status, riskScore: daysToExpiry < 30 ? 0.9 : 0.1,
      notes: notes || ''
    });

    res.json({ licenseId, status, daysToExpiry });
  } catch (err) { next(err); }
};

const getLicenses = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const records = await runQuery(`
      MATCH (c:Company {companyId: $companyId})-[:HOLDS]->(l:License)-[:IS_TYPE_OF]->(lt:LicenseType)
      OPTIONAL MATCH (lt)-[:GOVERNED_BY]->(r:Regulator)
      RETURN l, lt, r
      ORDER BY l.daysToExpiry ASC
    `, { companyId });
    const licenses = records.map(r => ({
      ...r.get('l').properties,
      licenseType: r.get('lt').properties,
      regulator: r.get('r')?.properties || null
    }));
    res.json(licenses);
  } catch (err) { next(err); }
};

const getApplicableLicenses = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const records = await runQuery(`
      MATCH (c:Company {companyId: $companyId})
      MATCH (lt:LicenseType)
      WHERE c.industryType IN lt.applicableTo
        AND (c.state IN lt.applicableStates OR 'all' IN lt.applicableStates)
      OPTIONAL MATCH (c)-[:HOLDS]->(l:License)-[:IS_TYPE_OF]->(lt)
      RETURN lt, l
      ORDER BY lt.penaltySeverity DESC
    `, { companyId });
    const result = records.map(r => ({
      licenseType: r.get('lt').properties,
      held: r.get('l') !== null,
      license: r.get('l')?.properties || null
    }));
    res.json(result);
  } catch (err) { next(err); }
};

const updateLicenseStatus = async (req, res, next) => {
  try {
    const { licenseId } = req.params;
    const { status, notes } = req.body;
    await runQuery(`
      MATCH (l:License {licenseId: $licenseId})
      SET l.status = $status, l.notes = $notes, l.updatedAt = datetime()
    `, { licenseId, status, notes: notes || '' });
    res.json({ updated: true });
  } catch (err) { next(err); }
};

module.exports = { addLicense, getLicenses, getApplicableLicenses, updateLicenseStatus };
