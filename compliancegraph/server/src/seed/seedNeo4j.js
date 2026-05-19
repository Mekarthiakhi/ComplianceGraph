require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { runQuery } = require('../config/neo4j');

const seed = async () => {
  console.log('Seeding Neo4j knowledge graph...');

  // Create Regulators
  await runQuery(`
    MERGE (r:Regulator {regulatorId: "TSPCB"})
    SET r.name = "Telangana State Pollution Control Board",
        r.shortName = "TSPCB", r.level = "state",
        r.state = "telangana",
        r.portalUrl = "https://tspcb.cgg.gov.in",
        r.averageProcessingDays = 45
  `);
  await runQuery(`
    MERGE (r:Regulator {regulatorId: "TG_DRUG_CTRL"})
    SET r.name = "Telangana Drug Control Authority",
        r.shortName = "TDCA", r.level = "state",
        r.state = "telangana",
        r.portalUrl = "https://drugs.telangana.gov.in",
        r.averageProcessingDays = 60
  `);
  await runQuery(`
    MERGE (r:Regulator {regulatorId: "TG_FACTORIES"})
    SET r.name = "Telangana Factories Inspectorate",
        r.shortName = "TFI", r.level = "state",
        r.state = "telangana",
        r.portalUrl = "https://factoriesinspectorate.telangana.gov.in",
        r.averageProcessingDays = 30
  `);
  await runQuery(`
    MERGE (r:Regulator {regulatorId: "FIRE_DEPT_HYD"})
    SET r.name = "Hyderabad Fire Department",
        r.shortName = "HFD", r.level = "municipal",
        r.state = "telangana",
        r.averageProcessingDays = 21
  `);
  await runQuery(`
    MERGE (r:Regulator {regulatorId: "GSTN"})
    SET r.name = "Goods and Services Tax Network",
        r.shortName = "GSTN", r.level = "central",
        r.portalUrl = "https://gst.gov.in",
        r.averageProcessingDays = 1
  `);

  // Create LicenseTypes
  const licenseTypes = [
    {
      licenseTypeId: "FACTORY_LICENSE_TG",
      name: "Factory License",
      shortCode: "FACTORY_LIC",
      applicableTo: ["pharma", "chemical", "food", "textile", "manufacturing"],
      applicableStates: ["telangana"],
      validityMonths: 12,
      renewalLeadDays: 60,
      penaltyDescription: "Up to ₹2L fine + imprisonment up to 3 months",
      penaltySeverity: "critical",
      governingAct: "Factories Act 1948",
      applicationPortalUrl: "https://factoriesinspectorate.telangana.gov.in",
      requiresPhysicalInspection: true,
      regulatorId: "TG_FACTORIES"
    },
    {
      licenseTypeId: "PCB_CTE_TG",
      name: "PCB Consent to Establish",
      shortCode: "PCB_CTE",
      applicableTo: ["pharma", "chemical"],
      applicableStates: ["telangana"],
      validityMonths: 60,
      renewalLeadDays: 90,
      penaltyDescription: "Up to ₹10L fine + factory shutdown",
      penaltySeverity: "critical",
      governingAct: "Environment Protection Act 1986",
      applicationPortalUrl: "https://tspcb.cgg.gov.in",
      requiresPhysicalInspection: true,
      regulatorId: "TSPCB"
    },
    {
      licenseTypeId: "PCB_CTO_TG",
      name: "PCB Consent to Operate",
      shortCode: "PCB_CTO",
      applicableTo: ["pharma", "chemical"],
      applicableStates: ["telangana"],
      validityMonths: 60,
      renewalLeadDays: 90,
      penaltyDescription: "Up to ₹10L fine + criminal prosecution",
      penaltySeverity: "critical",
      governingAct: "Water Act 1974 + Air Act 1981",
      applicationPortalUrl: "https://tspcb.cgg.gov.in",
      requiresPhysicalInspection: true,
      regulatorId: "TSPCB"
    },
    {
      licenseTypeId: "FIRE_NOC_TG",
      name: "Fire Safety NOC",
      shortCode: "FIRE_NOC",
      applicableTo: ["pharma", "chemical", "food", "manufacturing"],
      applicableStates: ["telangana"],
      validityMonths: 12,
      renewalLeadDays: 30,
      penaltyDescription: "Shutdown order + ₹1L fine",
      penaltySeverity: "high",
      governingAct: "Telangana Fire Services Act",
      applicationPortalUrl: "https://tsfire.telangana.gov.in",
      requiresPhysicalInspection: true,
      regulatorId: "FIRE_DEPT_HYD"
    },
    {
      licenseTypeId: "DRUG_MFG_FORM25",
      name: "Drug Manufacturing License (Form 25)",
      shortCode: "DRUG_MFG",
      applicableTo: ["pharma"],
      applicableStates: ["telangana"],
      validityMonths: 60,
      renewalLeadDays: 120,
      penaltyDescription: "License cancellation + criminal prosecution under DCA 1940",
      penaltySeverity: "critical",
      governingAct: "Drugs and Cosmetics Act 1940",
      applicationPortalUrl: "https://drugs.telangana.gov.in",
      requiresPhysicalInspection: true,
      regulatorId: "TG_DRUG_CTRL"
    },
    {
      licenseTypeId: "GST_RETURNS",
      name: "GST Monthly Returns",
      shortCode: "GST_RETURNS",
      applicableTo: ["pharma", "chemical", "food", "textile", "manufacturing"],
      applicableStates: ["telangana", "all"],
      validityMonths: 1,
      renewalLeadDays: 7,
      penaltyDescription: "₹50/day late fee + 18% interest",
      penaltySeverity: "medium",
      governingAct: "Goods and Services Tax Act 2017",
      applicationPortalUrl: "https://gst.gov.in",
      requiresPhysicalInspection: false,
      regulatorId: "GSTN"
    },
    {
      licenseTypeId: "HAZ_WASTE_AUTH",
      name: "Hazardous Waste Authorization",
      shortCode: "HAZ_WASTE",
      applicableTo: ["pharma", "chemical"],
      applicableStates: ["telangana"],
      validityMonths: 60,
      renewalLeadDays: 90,
      penaltyDescription: "Up to ₹5L fine + criminal case under EPA",
      penaltySeverity: "critical",
      governingAct: "Hazardous Waste Management Rules 2016",
      applicationPortalUrl: "https://tspcb.cgg.gov.in",
      requiresPhysicalInspection: true,
      regulatorId: "TSPCB"
    }
  ];

  for (const lt of licenseTypes) {
    await runQuery(`
      MERGE (lt:LicenseType {licenseTypeId: $licenseTypeId})
      SET lt += $props
      WITH lt
      MATCH (r:Regulator {regulatorId: $regulatorId})
      MERGE (lt)-[:GOVERNED_BY]->(r)
    `, {
      licenseTypeId: lt.licenseTypeId,
      regulatorId: lt.regulatorId,
      props: {
        name: lt.name, shortCode: lt.shortCode,
        applicableTo: lt.applicableTo,
        applicableStates: lt.applicableStates,
        validityMonths: lt.validityMonths,
        renewalLeadDays: lt.renewalLeadDays,
        penaltyDescription: lt.penaltyDescription,
        penaltySeverity: lt.penaltySeverity,
        governingAct: lt.governingAct,
        applicationPortalUrl: lt.applicationPortalUrl,
        requiresPhysicalInspection: lt.requiresPhysicalInspection
      }
    });
  }

  // Create REQUIRES relationships (the knowledge graph edges)
  const dependencies = [
    { from: "DRUG_MFG_FORM25", to: "PCB_CTO_TG", condition: "Must be active at time of drug license renewal", mandatory: true },
    { from: "DRUG_MFG_FORM25", to: "FACTORY_LICENSE_TG", condition: "Must be valid throughout drug license period", mandatory: true },
    { from: "DRUG_MFG_FORM25", to: "FIRE_NOC_TG", condition: "Must be current at renewal", mandatory: true },
    { from: "PCB_CTO_TG", to: "PCB_CTE_TG", condition: "CTE must precede CTO application", mandatory: true },
    { from: "HAZ_WASTE_AUTH", to: "PCB_CTO_TG", condition: "PCB consent required for haz waste authorization", mandatory: true },
    { from: "FACTORY_LICENSE_TG", to: "FIRE_NOC_TG", condition: "Fire NOC needed for factory license", mandatory: true },
  ];

  for (const dep of dependencies) {
    await runQuery(`
      MATCH (from:LicenseType {licenseTypeId: $from}),
            (to:LicenseType {licenseTypeId: $to})
      MERGE (from)-[:REQUIRES {condition: $condition, mandatory: $mandatory}]->(to)
    `, dep);
  }

  // Create required document nodes
  const documents = [
    { docId: "DOC_PCB_ETP", name: "Effluent Treatment Plant Report", forLicense: "PCB_CTO", stage: "renewal" },
    { docId: "DOC_PCB_LAYOUT", name: "Factory Layout Plan", forLicense: "PCB_CTE", stage: "application" },
    { docId: "DOC_DRUG_GMP", name: "GMP Compliance Certificate", forLicense: "DRUG_MFG", stage: "renewal" },
    { docId: "DOC_DRUG_QP", name: "Qualified Person Certificate", forLicense: "DRUG_MFG", stage: "application" },
    { docId: "DOC_FIRE_EXTINGUISHER", name: "Fire Extinguisher Inspection Report", forLicense: "FIRE_NOC", stage: "renewal" },
  ];

  for (const doc of documents) {
    await runQuery(`
      MERGE (d:DocumentRequirement {docId: $docId})
      SET d.name = $name, d.stage = $stage
      WITH d
      MATCH (lt:LicenseType {shortCode: $forLicense})
      MERGE (lt)-[:NEEDS_DOCUMENT]->(d)
    `, doc);
  }

  console.log('✅ Neo4j seed complete. Knowledge graph ready.');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
