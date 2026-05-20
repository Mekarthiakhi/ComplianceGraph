const { runQuery } = require('../config/neo4j');

// Helpers to format Neo4j custom Date/DateTime objects into standard JS strings
const formatDate = (dateObj) => {
  if (!dateObj) return null;
  if (typeof dateObj === 'string') return dateObj;
  
  const year = dateObj.year?.low !== undefined ? dateObj.year.low : dateObj.year;
  const month = dateObj.month?.low !== undefined ? dateObj.month.low : dateObj.month;
  const day = dateObj.day?.low !== undefined ? dateObj.day.low : dateObj.day;

  if (year !== undefined && month !== undefined && day !== undefined) {
    const y = String(year);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(dateObj);
};

const formatDateTime = (dtObj) => {
  if (!dtObj) return null;
  if (typeof dtObj === 'string') return dtObj;
  
  const year = dtObj.year?.low !== undefined ? dtObj.year.low : dtObj.year;
  const month = dtObj.month?.low !== undefined ? dtObj.month.low : dtObj.month;
  const day = dtObj.day?.low !== undefined ? dtObj.day.low : dtObj.day;
  const hour = dtObj.hour?.low !== undefined ? dtObj.hour.low : dtObj.hour;
  const minute = dtObj.minute?.low !== undefined ? dtObj.minute.low : dtObj.minute;
  const second = dtObj.second?.low !== undefined ? dtObj.second.low : dtObj.second;

  if (year !== undefined && month !== undefined && day !== undefined) {
    try {
      return new Date(
        year,
        month - 1,
        day,
        hour || 0,
        minute || 0,
        second || 0
      ).toISOString();
    } catch (e) {
      return String(dtObj);
    }
  }
  return String(dtObj);
};

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
    }, 'WRITE');

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
    const licenses = records.map(r => {
      const lProps = r.get('l').properties;
      return {
        ...lProps,
        issueDate: formatDate(lProps.issueDate),
        expiryDate: formatDate(lProps.expiryDate),
        createdAt: formatDateTime(lProps.createdAt),
        licenseType: r.get('lt').properties,
        regulator: r.get('r')?.properties || null
      };
    });
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
    const result = records.map(r => {
      const lProps = r.get('l')?.properties || null;
      return {
        licenseType: r.get('lt').properties,
        held: r.get('l') !== null,
        license: lProps ? {
          ...lProps,
          issueDate: formatDate(lProps.issueDate),
          expiryDate: formatDate(lProps.expiryDate),
          createdAt: formatDateTime(lProps.createdAt)
        } : null
      };
    });
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
    `, { licenseId, status, notes: notes || '' }, 'WRITE');
    res.json({ updated: true });
  } catch (err) { next(err); }
};

module.exports = { addLicense, getLicenses, getApplicableLicenses, updateLicenseStatus };
