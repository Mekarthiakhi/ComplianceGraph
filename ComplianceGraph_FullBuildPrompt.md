# ComplianceGraph — Full Scalable App Build Prompt
### Stack: React + Node.js + Firebase + Claude API + Twilio + Razorpay + Neo4j

---

## SYSTEM CONTEXT

You are a senior full-stack engineer building **ComplianceGraph** — an AI-powered compliance intelligence platform for Indian industrial companies. The system maps every company's regulatory obligations as a knowledge graph in Neo4j, alerts them before licenses expire via WhatsApp (Twilio), accepts payments via Razorpay, uses Claude API to generate AI checklists, and is built on React (frontend) + Node.js (backend) + Firebase (auth + storage).

Build everything production-grade, scalable, and deployable. No placeholder code. Every function must work.

---

## PROJECT STRUCTURE

```
compliancegraph/
├── client/                        # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ComplianceScore.jsx
│   │   │   │   ├── LicenseTimeline.jsx
│   │   │   │   ├── AlertFeed.jsx
│   │   │   │   └── RiskMap.jsx
│   │   │   ├── licenses/
│   │   │   │   ├── LicenseList.jsx
│   │   │   │   ├── LicenseCard.jsx
│   │   │   │   ├── LicenseDetail.jsx
│   │   │   │   └── AddLicense.jsx
│   │   │   ├── graph/
│   │   │   │   └── GraphView.jsx
│   │   │   ├── ai/
│   │   │   │   └── AIChecklist.jsx
│   │   │   ├── billing/
│   │   │   │   └── Billing.jsx
│   │   │   └── shared/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── ProtectedRoute.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useLicenses.js
│   │   │   └── useGraph.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── firebase.js
│   │   ├── store/
│   │   │   └── authStore.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
├── server/                        # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── neo4j.js
│   │   │   ├── firebase.js
│   │   │   ├── twilio.js
│   │   │   └── razorpay.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── companies.js
│   │   │   ├── licenses.js
│   │   │   ├── graph.js
│   │   │   ├── ai.js
│   │   │   ├── alerts.js
│   │   │   └── payments.js
│   │   ├── controllers/
│   │   │   ├── companyController.js
│   │   │   ├── licenseController.js
│   │   │   ├── graphController.js
│   │   │   ├── aiController.js
│   │   │   ├── alertController.js
│   │   │   └── paymentController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── jobs/
│   │   │   └── alertCronJob.js
│   │   ├── seed/
│   │   │   └── seedNeo4j.js
│   │   └── app.js
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## STEP 1 — ENVIRONMENT VARIABLES

### client/.env
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_RAZORPAY_KEY_ID=rzp_test_your_key
```

### server/.env
```env
PORT=5000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLAUDE_API_KEY=your_claude_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## STEP 2 — SERVER SETUP

### server/package.json
```json
{
  "name": "compliancegraph-server",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "seed": "node src/seed/seedNeo4j.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "neo4j-driver": "^5.18.0",
    "firebase-admin": "^12.0.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "twilio": "^4.23.0",
    "razorpay": "^2.9.2",
    "node-cron": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express-validator": "^7.0.1",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

### server/src/app.js
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorMiddleware } = require('./middleware/errorMiddleware');
require('./jobs/alertCronJob'); // Start cron on server boot

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/licenses', require('./routes/licenses'));
app.use('/api/graph', require('./routes/graph'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/payments', require('./routes/payments'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ComplianceGraph server running on port ${PORT}`));
```

---

## STEP 3 — NEO4J CONFIG + SEED DATA

### server/src/config/neo4j.js
```javascript
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const getSession = () => driver.session();

const runQuery = async (cypher, params = {}) => {
  const session = getSession();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
};

module.exports = { driver, getSession, runQuery };
```

### server/src/seed/seedNeo4j.js
```javascript
require('dotenv').config({ path: '../../.env' });
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
    // Drug License requires PCB CTO
    { from: "DRUG_MFG_FORM25", to: "PCB_CTO_TG", condition: "Must be active at time of drug license renewal", mandatory: true },
    // Drug License requires Factory License
    { from: "DRUG_MFG_FORM25", to: "FACTORY_LICENSE_TG", condition: "Must be valid throughout drug license period", mandatory: true },
    // Drug License requires Fire NOC
    { from: "DRUG_MFG_FORM25", to: "FIRE_NOC_TG", condition: "Must be current at renewal", mandatory: true },
    // PCB CTO requires PCB CTE (CTE comes first)
    { from: "PCB_CTO_TG", to: "PCB_CTE_TG", condition: "CTE must precede CTO application", mandatory: true },
    // Hazardous Waste requires PCB CTO
    { from: "HAZ_WASTE_AUTH", to: "PCB_CTO_TG", condition: "PCB consent required for haz waste authorization", mandatory: true },
    // Factory License requires Fire NOC
    { from: "FACTORY_LICENSE_TG", to: "FIRE_NOC_TG", condition: "Fire NOC needed for factory license", mandatory: true },
  ];

  for (const dep of dependencies) {
    await runQuery(`
      MATCH (from:LicenseType {licenseTypeId: $from}),
            (to:LicenseType {licenseTypeId: $to})
      MERGE (from)-[:REQUIRES {condition: $condition, mandatory: $mandatory}]->(to)
    `, dep);
  }

  // Create required document nodes for key license types
  const documents = [
    { docId: "DOC_PCB_ETP", name: "Effluent Treatment Plant Report", forLicense: "PCB_CTO_TG", stage: "renewal" },
    { docId: "DOC_PCB_LAYOUT", name: "Factory Layout Plan", forLicense: "PCB_CTE_TG", stage: "application" },
    { docId: "DOC_DRUG_GMP", name: "GMP Compliance Certificate", forLicense: "DRUG_MFG_FORM25", stage: "renewal" },
    { docId: "DOC_DRUG_QP", name: "Qualified Person Certificate", forLicense: "DRUG_MFG_FORM25", stage: "application" },
    { docId: "DOC_FIRE_EXTINGUISHER", name: "Fire Extinguisher Inspection Report", forLicense: "FIRE_NOC_TG", stage: "renewal" },
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

  console.log('Neo4j seed complete. Knowledge graph ready.');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
```

---

## STEP 4 — MIDDLEWARE

### server/src/middleware/authMiddleware.js
```javascript
const admin = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authMiddleware };
```

### server/src/middleware/errorMiddleware.js
```javascript
const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = { errorMiddleware };
```

---

## STEP 5 — FIREBASE CONFIG

### server/src/config/firebase.js
```javascript
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

module.exports = admin;
```

---

## STEP 6 — CONTROLLERS

### server/src/controllers/companyController.js
```javascript
const { runQuery } = require('../config/neo4j');

// Onboard a new company and automatically assign applicable licenses
const onboardCompany = async (req, res, next) => {
  try {
    const { name, industryType, subIndustry, state, city, industrialZone, employeeCount, gstin, registeredAddress, phone } = req.body;
    const companyId = `CMP-${Date.now()}`;
    const firebaseUid = req.user.uid;

    // Create company node
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
    `, { companyId, name, industryType, subIndustry, state, city, industrialZone, employeeCount: parseInt(employeeCount), gstin, registeredAddress, phone, firebaseUid });

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
    `, { companyId });
    res.json(records[0]?.toObject() || { score: 1.0, total: 0, expired: 0, critical: 0 });
  } catch (err) { next(err); }
};

module.exports = { onboardCompany, getCompany, getComplianceScore };
```

### server/src/controllers/licenseController.js
```javascript
const { runQuery } = require('../config/neo4j');

const addLicense = async (req, res, next) => {
  try {
    const { companyId, licenseTypeId, licenseNumber, issueDate, expiryDate, notes } = req.body;
    const licenseId = `LIC-${companyId}-${Date.now()}`;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysToExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    const status = daysToExpiry < 0 ? 'expired' : daysToExpiry < 30 ? 'pending_renewal' : 'active';

    await runQuery(`
      MATCH (c:Company {companyId: $companyId}),
            (lt:LicenseType {licenseTypeId: $licenseTypeId})
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
      companyId, licenseTypeId, licenseId, licenseNumber,
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
      regulator: r.get('r')?.properties
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
    `, { licenseId, status, notes });
    res.json({ updated: true });
  } catch (err) { next(err); }
};

module.exports = { addLicense, getLicenses, getApplicableLicenses, updateLicenseStatus };
```

### server/src/controllers/graphController.js
```javascript
const { runQuery } = require('../config/neo4j');

// Get the full dependency graph for a company
const getCompanyGraph = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const records = await runQuery(`
      MATCH (c:Company {companyId: $companyId})-[:HOLDS]->(l:License)-[:IS_TYPE_OF]->(lt:LicenseType)
      OPTIONAL MATCH (lt)-[req:REQUIRES]->(dep:LicenseType)
      RETURN l, lt, collect({type: dep, rel: req}) AS dependencies
    `, { companyId });

    const nodes = [];
    const edges = [];
    const seen = new Set();

    records.forEach(r => {
      const lt = r.get('lt').properties;
      const l = r.get('l').properties;
      if (!seen.has(lt.shortCode)) {
        nodes.push({ id: lt.shortCode, label: lt.name, status: l.status, daysToExpiry: l.daysToExpiry, severity: lt.penaltySeverity });
        seen.add(lt.shortCode);
      }
      r.get('dependencies').forEach(dep => {
        if (dep.type) {
          const depProps = dep.type.properties;
          if (!seen.has(depProps.shortCode)) {
            nodes.push({ id: depProps.shortCode, label: depProps.name, status: 'dependency', severity: depProps.penaltySeverity });
            seen.add(depProps.shortCode);
          }
          edges.push({ from: lt.shortCode, to: depProps.shortCode, mandatory: dep.rel?.properties?.mandatory });
        }
      });
    });

    res.json({ nodes, edges });
  } catch (err) { next(err); }
};

// Find what's blocking a specific license renewal
const getBlockers = async (req, res, next) => {
  try {
    const { companyId, licenseTypeId } = req.params;
    const records = await runQuery(`
      MATCH (target:LicenseType {licenseTypeId: $licenseTypeId})
      MATCH path = (target)-[:REQUIRES*1..5]->(prereq:LicenseType)
      MATCH (c:Company {companyId: $companyId})-[:HOLDS]->(l:License)-[:IS_TYPE_OF]->(prereq)
      WHERE l.status IN ['expired', 'suspended', 'pending_renewal']
      RETURN prereq.name AS name, prereq.shortCode AS shortCode,
             l.status AS status, l.expiryDate AS expiryDate,
             length(path) AS depth
      ORDER BY depth ASC
    `, { companyId, licenseTypeId });

    const blockers = records.map(r => r.toObject());
    res.json({ blockers, isBlocked: blockers.length > 0 });
  } catch (err) { next(err); }
};

// Get overall graph stats
const getGraphStats = async (req, res, next) => {
  try {
    const records = await runQuery(`
      MATCH (lt:LicenseType)-[:REQUIRES]->(dep:LicenseType)
      RETURN count(*) AS totalEdges
    `);
    const nodeCount = await runQuery(`MATCH (lt:LicenseType) RETURN count(lt) AS count`);
    res.json({
      totalLicenseTypes: nodeCount[0].get('count').toNumber(),
      totalDependencies: records[0].get('totalEdges').toNumber()
    });
  } catch (err) { next(err); }
};

module.exports = { getCompanyGraph, getBlockers, getGraphStats };
```

### server/src/controllers/aiController.js
```javascript
const Anthropic = require('@anthropic-ai/sdk');
const { runQuery } = require('../config/neo4j');

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Generate AI renewal checklist for a specific license
const generateChecklist = async (req, res, next) => {
  try {
    const { companyId, licenseTypeId } = req.body;

    // Pull context from Neo4j
    const licenseData = await runQuery(`
      MATCH (c:Company {companyId: $companyId})-[:HOLDS]->(l:License)-[:IS_TYPE_OF]->(lt:LicenseType {licenseTypeId: $licenseTypeId})
      OPTIONAL MATCH (lt)-[:GOVERNED_BY]->(r:Regulator)
      OPTIONAL MATCH (lt)-[:NEEDS_DOCUMENT]->(d:DocumentRequirement)
      OPTIONAL MATCH (lt)-[:REQUIRES]->(dep:LicenseType)
      RETURN c, l, lt, r, collect(distinct d.name) AS docs, collect(distinct dep.name) AS prereqs
    `, { companyId, licenseTypeId });

    if (!licenseData.length) return res.status(404).json({ error: 'License not found' });

    const r = licenseData[0];
    const company = r.get('c').properties;
    const license = r.get('l').properties;
    const lt = r.get('lt').properties;
    const regulator = r.get('r')?.properties;
    const docs = r.get('docs');
    const prereqs = r.get('prereqs');

    const prompt = `
You are a compliance expert for Indian industrial companies. Generate a detailed, actionable renewal checklist.

COMPANY: ${company.name}
INDUSTRY: ${company.industryType} — ${company.subIndustry}
LOCATION: ${company.industrialZone}, ${company.city}, ${company.state}
EMPLOYEES: ${company.employeeCount}

LICENSE TO RENEW: ${lt.name}
LICENSE NUMBER: ${license.licenseNumber}
EXPIRY DATE: ${license.expiryDate}
DAYS TO EXPIRY: ${license.daysToExpiry}
GOVERNING ACT: ${lt.governingAct}
REGULATOR: ${regulator?.name || 'N/A'}
PORTAL: ${lt.applicationPortalUrl}
AVERAGE PROCESSING TIME: ${regulator?.averageProcessingDays || 30} days

PREREQUISITES THAT MUST BE VALID: ${prereqs.join(', ') || 'None'}
KNOWN REQUIRED DOCUMENTS: ${docs.join(', ') || 'Standard documents'}

Generate:
1. Step-by-step renewal process (numbered, specific, actionable)
2. Complete document checklist with description of each
3. Timeline — what to do at 90, 60, 30, 14, 7 days before expiry
4. Common mistakes companies make during this renewal
5. Contact details to arrange with regulator
6. Estimated fees

Be specific to Indian regulations and Telangana state rules. No generic advice.
    `;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ checklist: response.content[0].text, licenseType: lt.name });
  } catch (err) { next(err); }
};

// Explain why a company's compliance score is what it is
const explainScore = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const records = await runQuery(`
      MATCH (c:Company {companyId: $companyId})-[:HOLDS]->(l:License)-[:IS_TYPE_OF]->(lt:LicenseType)
      RETURN lt.name AS name, l.status AS status, l.daysToExpiry AS days, lt.penaltySeverity AS severity
      ORDER BY l.daysToExpiry ASC
    `, { companyId });

    const licenses = records.map(r => r.toObject());
    const prompt = `
You are a compliance advisor. Based on these license statuses, explain in plain language what the company needs to do urgently, in order of priority. Be direct and specific.

Licenses: ${JSON.stringify(licenses)}

Give a 3-5 sentence plain English summary then a prioritized action list.
    `;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ explanation: response.content[0].text });
  } catch (err) { next(err); }
};

module.exports = { generateChecklist, explainScore };
```

### server/src/controllers/alertController.js
```javascript
const twilio = require('twilio');
const { runQuery } = require('../config/neo4j');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsAppAlert = async (to, message) => {
  return twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
    body: message
  });
};

const runDailyAlerts = async () => {
  console.log('Running daily compliance alerts...');
  const thresholds = [90, 60, 30, 15, 7];

  for (const days of thresholds) {
    const records = await runQuery(`
      MATCH (c:Company)-[:HOLDS]->(l:License)-[:IS_TYPE_OF]->(lt:LicenseType)
      WHERE l.daysToExpiry = $days AND l.status = 'active'
        AND c.phone IS NOT NULL
        AND c.subscriptionStatus IN ['active', 'trial']
      RETURN c.name AS company, c.phone AS phone,
             lt.name AS licenseName, l.expiryDate AS expiry,
             lt.penaltySeverity AS severity, lt.penaltyDescription AS penalty
    `, { days });

    for (const r of records) {
      const d = r.toObject();
      const urgency = days <= 15 ? '🚨 URGENT' : days <= 30 ? '⚠️ WARNING' : '📋 REMINDER';
      const msg = `${urgency} — ComplianceGraph Alert\n\n*${d.company}*\nYour *${d.licenseName}* expires in *${days} days* (${d.expiry}).\n\nPenalty if missed: ${d.penalty}\n\nOpen ComplianceGraph for renewal checklist: https://compliancegraph.in`;

      try {
        await sendWhatsAppAlert(d.phone, msg);
        console.log(`Alert sent to ${d.company} for ${d.licenseName}`);
      } catch (err) {
        console.error(`Failed to send alert to ${d.phone}:`, err.message);
      }
    }
  }
};

const sendTestAlert = async (req, res, next) => {
  try {
    const { phone, message } = req.body;
    await sendWhatsAppAlert(phone, message || 'Test alert from ComplianceGraph. Your compliance dashboard is active.');
    res.json({ sent: true });
  } catch (err) { next(err); }
};

module.exports = { runDailyAlerts, sendTestAlert };
```

### server/src/controllers/paymentController.js
```javascript
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { runQuery } = require('../config/neo4j');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  starter: { amount: 500000, name: 'Starter — ₹5,000/month', months: 1 },
  professional: { amount: 1200000, name: 'Professional — ₹12,000/quarter', months: 3 },
  enterprise: { amount: 4000000, name: 'Enterprise — ₹40,000/year', months: 12 },
};

const createOrder = async (req, res, next) => {
  try {
    const { companyId, plan } = req.body;
    const selectedPlan = PLANS[plan];
    if (!selectedPlan) return res.status(400).json({ error: 'Invalid plan' });

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: 'INR',
      receipt: `cg_${companyId}_${Date.now()}`,
      notes: { companyId, plan }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, planName: selectedPlan.name });
  } catch (err) { next(err); }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, companyId, plan } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const selectedPlan = PLANS[plan];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + selectedPlan.months);

    await runQuery(`
      MATCH (c:Company {companyId: $companyId})
      SET c.subscriptionStatus = 'active',
          c.subscriptionPlan = $plan,
          c.subscriptionExpiresAt = $expiresAt,
          c.lastPaymentId = $paymentId
    `, { companyId, plan, expiresAt: expiresAt.toISOString(), paymentId: razorpay_payment_id });

    res.json({ success: true, subscriptionValidUntil: expiresAt });
  } catch (err) { next(err); }
};

module.exports = { createOrder, verifyPayment };
```

---

## STEP 7 — ROUTES

### server/src/routes/companies.js
```javascript
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { onboardCompany, getCompany, getComplianceScore } = require('../controllers/companyController');

router.post('/onboard', authMiddleware, onboardCompany);
router.get('/me', authMiddleware, getCompany);
router.get('/:companyId/score', authMiddleware, getComplianceScore);

module.exports = router;
```

### server/src/routes/licenses.js
```javascript
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { addLicense, getLicenses, getApplicableLicenses, updateLicenseStatus } = require('../controllers/licenseController');

router.post('/', authMiddleware, addLicense);
router.get('/:companyId', authMiddleware, getLicenses);
router.get('/:companyId/applicable', authMiddleware, getApplicableLicenses);
router.patch('/:licenseId/status', authMiddleware, updateLicenseStatus);

module.exports = router;
```

### server/src/routes/graph.js
```javascript
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getCompanyGraph, getBlockers, getGraphStats } = require('../controllers/graphController');

router.get('/:companyId', authMiddleware, getCompanyGraph);
router.get('/:companyId/blockers/:licenseTypeId', authMiddleware, getBlockers);
router.get('/stats/overview', getGraphStats);

module.exports = router;
```

### server/src/routes/ai.js
```javascript
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateChecklist, explainScore } = require('../controllers/aiController');

router.post('/checklist', authMiddleware, generateChecklist);
router.get('/explain/:companyId', authMiddleware, explainScore);

module.exports = router;
```

### server/src/routes/alerts.js
```javascript
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendTestAlert } = require('../controllers/alertController');

router.post('/test', authMiddleware, sendTestAlert);

module.exports = router;
```

### server/src/routes/payments.js
```javascript
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

router.post('/order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);

module.exports = router;
```

---

## STEP 8 — CRON JOB

### server/src/jobs/alertCronJob.js
```javascript
const cron = require('node-cron');
const { runDailyAlerts } = require('../controllers/alertController');

// Run every day at 8:00 AM IST
cron.schedule('30 2 * * *', async () => {
  console.log('Running scheduled compliance alerts — 8AM IST');
  await runDailyAlerts();
}, { timezone: 'Asia/Kolkata' });

console.log('Alert cron job scheduled.');
```

---

## STEP 9 — REACT FRONTEND

### client/package.json
```json
{
  "name": "compliancegraph-client",
  "version": "1.0.0",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "firebase": "^10.11.0",
    "axios": "^1.7.0",
    "zustand": "^4.5.2",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.383.0",
    "recharts": "^2.12.0",
    "reactflow": "^11.11.3",
    "razorpay": "^2.9.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

### client/src/services/firebase.js
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
```

### client/src/services/api.js
```javascript
import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### client/src/store/authStore.js
```javascript
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  company: null,
  loading: true,
  setUser: (user) => set({ user }),
  setCompany: (company) => set({ company }),
  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
```

### client/src/App.jsx
```jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth } from './services/firebase';
import useAuthStore from './store/authStore';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import LicenseList from './components/licenses/LicenseList';
import AddLicense from './components/licenses/AddLicense';
import GraphView from './components/graph/GraphView';
import AIChecklist from './components/ai/AIChecklist';
import Billing from './components/billing/Billing';

export default function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/licenses" element={<ProtectedRoute><LicenseList /></ProtectedRoute>} />
        <Route path="/licenses/add" element={<ProtectedRoute><AddLicense /></ProtectedRoute>} />
        <Route path="/graph" element={<ProtectedRoute><GraphView /></ProtectedRoute>} />
        <Route path="/ai-checklist" element={<ProtectedRoute><AIChecklist /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### client/src/components/shared/ProtectedRoute.jsx
```jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}
```

### client/src/components/auth/Login.jsx
```jsx
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../services/firebase';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">ComplianceGraph</h1>
        <p className="text-gray-500 text-sm mb-8">Sign in to your compliance dashboard</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@company.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          New company? <Link to="/register" className="text-indigo-600 hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
```

### client/src/components/auth/Register.jsx
```jsx
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../services/firebase';
import api from '../../services/api';
import toast from 'react-hot-toast';

const INDUSTRIES = ['pharma', 'chemical', 'food', 'textile', 'manufacturing'];
const ZONES = ['patancheru', 'bollaram', 'genome_valley', 'uppal', 'nacharam', 'jeedimetla', 'other'];

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '', name: '', industryType: 'pharma', subIndustry: '', state: 'telangana', city: 'hyderabad', industrialZone: 'patancheru', employeeCount: '', gstin: '', registeredAddress: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      await api.post('/companies/onboard', form);
      toast.success('Welcome to ComplianceGraph!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create account</h1>
        <p className="text-gray-500 text-sm mb-8">Set up your compliance dashboard in 2 minutes</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && <>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
                <input value={form.name} onChange={e => update('name', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select value={form.industryType} onChange={e => update('industryType', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industrial zone</label>
                <select value={form.industrialZone} onChange={e => update('industrialZone', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {ZONES.map(z => <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Next →</button>
          </>}
          {step === 2 && <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (WhatsApp)</label>
                <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+91XXXXXXXXXX" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employees</label>
                <input type="number" value={form.employeeCount} onChange={e => update('employeeCount', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input value={form.gstin} onChange={e => update('gstin', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-industry</label>
                <input value={form.subIndustry} onChange={e => update('subIndustry', e.target.value)} placeholder="api_manufacturer" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Registered address</label>
                <textarea value={form.registeredAddress} onChange={e => update('registeredAddress', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">← Back</button>
              <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{loading ? 'Creating...' : 'Create account'}</button>
            </div>
          </>}
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
```

### client/src/components/dashboard/Dashboard.jsx
```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, FileText, Network, Sparkles, CreditCard } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function Dashboard() {
  const { company } = useAuthStore();
  const [score, setScore] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [loadingExplain, setLoadingExplain] = useState(false);

  useEffect(() => {
    if (!company) return;
    api.get(`/companies/${company.companyId}/score`).then(r => setScore(r.data));
    api.get(`/licenses/${company.companyId}`).then(r => setLicenses(r.data));
  }, [company]);

  const getAIExplanation = async () => {
    setLoadingExplain(true);
    try {
      const r = await api.get(`/ai/explain/${company.companyId}`);
      setExplanation(r.data.explanation);
    } finally { setLoadingExplain(false); }
  };

  const scoreColor = !score ? 'text-gray-400' : score.score >= 0.8 ? 'text-emerald-600' : score.score >= 0.5 ? 'text-amber-500' : 'text-red-600';
  const criticalLicenses = licenses.filter(l => l.daysToExpiry < 30 && l.status === 'active');
  const expiredLicenses = licenses.filter(l => l.status === 'expired');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-gray-900">ComplianceGraph</span>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/licenses" className="text-gray-500 hover:text-gray-900">Licenses</Link>
          <Link to="/graph" className="text-gray-500 hover:text-gray-900">Graph</Link>
          <Link to="/ai-checklist" className="text-gray-500 hover:text-gray-900">AI Checklist</Link>
          <Link to="/billing" className="text-gray-500 hover:text-gray-900">Billing</Link>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Compliance Dashboard</h2>
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-500 mb-1">Compliance score</p>
            <p className={`text-3xl font-semibold ${scoreColor}`}>{score ? Math.round(score.score * 100) : '--'}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-500 mb-1">Total licenses</p>
            <p className="text-3xl font-semibold text-gray-900">{score?.total || 0}</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
            <p className="text-xs text-amber-600 mb-1">Expiring in 30 days</p>
            <p className="text-3xl font-semibold text-amber-600">{criticalLicenses.length}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-5">
            <p className="text-xs text-red-500 mb-1">Expired</p>
            <p className="text-3xl font-semibold text-red-600">{expiredLicenses.length}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { to: '/licenses/add', icon: FileText, label: 'Add license', sub: 'Track a new compliance license' },
            { to: '/graph', icon: Network, label: 'View dependency graph', sub: 'See license relationships' },
            { to: '/ai-checklist', icon: Sparkles, label: 'AI renewal checklist', sub: 'Get step-by-step guidance' },
          ].map(({ to, icon: Icon, label, sub }) => (
            <Link key={to} to={to} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-sm transition-all group">
              <Icon size={20} className="text-indigo-500 mb-3" />
              <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </Link>
          ))}
        </div>

        {/* Urgent alerts */}
        {(criticalLicenses.length > 0 || expiredLicenses.length > 0) && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Action required
            </h3>
            <div className="space-y-3">
              {[...expiredLicenses, ...criticalLicenses].map(l => (
                <div key={l.licenseId} className={`flex items-center justify-between p-3 rounded-lg ${l.status === 'expired' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.licenseType?.name}</p>
                    <p className="text-xs text-gray-500">{l.licenseNumber}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${l.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {l.status === 'expired' ? 'Expired' : `${l.daysToExpiry}d left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Explanation */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" /> AI compliance advisor
            </h3>
            <button onClick={getAIExplanation} disabled={loadingExplain}
              className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loadingExplain ? 'Analyzing...' : 'Analyze my compliance'}
            </button>
          </div>
          {explanation && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{explanation}</p>}
          {!explanation && <p className="text-sm text-gray-400">Click "Analyze my compliance" to get an AI-powered assessment of your current status and priority actions.</p>}
        </div>
      </div>
    </div>
  );
}
```

### client/src/components/licenses/AddLicense.jsx
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function AddLicense() {
  const { company } = useAuthStore();
  const [applicable, setApplicable] = useState([]);
  const [form, setForm] = useState({ licenseTypeId: '', licenseNumber: '', issueDate: '', expiryDate: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!company) return;
    api.get(`/licenses/${company.companyId}/applicable`).then(r => setApplicable(r.data));
  }, [company]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/licenses', { ...form, companyId: company.companyId });
      toast.success('License added successfully');
      navigate('/licenses');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add license');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Add a license</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License type</label>
            <select value={form.licenseTypeId} onChange={e => setForm(f => ({ ...f, licenseTypeId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
              <option value="">Select license type</option>
              {applicable.map(({ licenseType, held }) => (
                <option key={licenseType.licenseTypeId} value={licenseType.licenseTypeId}>
                  {licenseType.name} {held ? '(already tracked)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License number</label>
            <input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
              placeholder="e.g. TSPCB/CTO/2024/1234"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue date</label>
              <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/licenses')}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Adding...' : 'Add license'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### client/src/components/billing/Billing.jsx
```jsx
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '₹5,000/month', description: 'Up to 10 licenses, WhatsApp alerts, AI checklists' },
  { id: 'professional', name: 'Professional', price: '₹12,000/quarter', description: 'Up to 30 licenses, priority support, all features' },
  { id: 'enterprise', name: 'Enterprise', price: '₹40,000/year', description: 'Unlimited licenses, dedicated account manager, custom reports' },
];

export default function Billing() {
  const { company } = useAuthStore();
  const [loading, setLoading] = useState(null);

  const handlePayment = async (plan) => {
    setLoading(plan);
    try {
      const { data } = await api.post('/payments/order', { companyId: company.companyId, plan });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'ComplianceGraph',
        description: data.planName,
        order_id: data.orderId,
        handler: async (response) => {
          await api.post('/payments/verify', { ...response, companyId: company.companyId, plan });
          toast.success('Payment successful! Subscription activated.');
        },
        prefill: { email: company?.email, contact: company?.phone },
        theme: { color: '#4F46E5' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Payment failed. Please try again.');
    } finally { setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose your plan</h2>
        <p className="text-gray-500 text-sm mb-8">Start free for 30 days. Cancel anytime.</p>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id} className={`bg-white rounded-xl border p-6 ${plan.id === 'professional' ? 'border-indigo-300 shadow-sm' : 'border-gray-100'}`}>
              {plan.id === 'professional' && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full mb-3 inline-block">Most popular</span>}
              <h3 className="font-semibold text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-xl font-semibold text-indigo-600 mb-3">{plan.price}</p>
              <p className="text-xs text-gray-500 mb-5">{plan.description}</p>
              <button onClick={() => handlePayment(plan.id)} disabled={loading === plan.id}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {loading === plan.id ? 'Processing...' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 10 — LAUNCH COMMANDS

```bash
# 1. Start Neo4j (Docker)
docker run -d -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/yourpassword \
  neo4j:latest

# 2. Seed the knowledge graph
cd server && npm install && npm run seed

# 3. Start backend
npm run dev

# 4. Start frontend (new terminal)
cd client && npm install && npm run dev

# 5. Load Razorpay script in index.html
# Add to client/index.html <head>:
# <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## SCALABILITY NOTES

- **Neo4j AuraDB** — move from local to AuraDB cloud when you have 20+ companies
- **Firebase Functions** — move the cron job to Firebase Scheduled Functions for serverless
- **Redis** — add Redis cache in front of frequently-run Cypher queries (compliance score, license list)
- **Rate limiting** — add `express-rate-limit` on AI endpoints (Claude API calls are expensive)
- **Multi-tenancy** — every Cypher query is already scoped to `companyId`, so multi-tenancy is built in
- **Horizontal scale** — Node.js server is stateless, deploy multiple instances behind a load balancer on Railway/Render

---

*ComplianceGraph — Built for Indian industrial compliance intelligence*
