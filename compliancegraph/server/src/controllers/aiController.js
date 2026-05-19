const Anthropic = require('@anthropic-ai/sdk');
const { runQuery } = require('../config/neo4j');

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Generate AI renewal checklist for a specific license
const generateChecklist = async (req, res, next) => {
  try {
    const { companyId, licenseTypeId } = req.body;

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

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });
      res.json({ checklist: response.content[0].text, licenseType: lt.name });
    } catch (aiErr) {
      console.warn("AI Generation Failed (likely missing API key), falling back to mock response.");
      const mockChecklist = `
### 1. Step-by-Step Renewal Process
1. Log into the regulatory portal.
2. Verify all existing company details.
3. Upload the required annexures.
4. Pay the renewal fee online.
5. Download the provisional receipt.

### 2. Document Checklist
- **Identity Proof**: Valid Aadhar/PAN of the authorized signatory.
- **Incorporation Certificate**: Valid certificate of company registration.
- **Previous License Copy**: The most recent valid or expired license.

### 3. Timeline
- **90 Days Before Expiry**: Begin gathering documents.
- **60 Days Before Expiry**: Initiate portal application.
- **30 Days Before Expiry**: Follow up with inspector.
- **14 Days Before Expiry**: Escalate if pending.

### 4. Common Mistakes
- Not attaching the latest property tax receipt.
- Incorrect digital signature attachment.

*(Note: This is a fallback mock response because the Anthropic API key is not configured in your .env file)*
      `;
      res.json({ checklist: mockChecklist.trim(), licenseType: lt.name });
    }
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

    const licenses = records.map(r => ({
      name: r.get('name'),
      status: r.get('status'),
      days: r.get('days'),
      severity: r.get('severity'),
    }));

    const prompt = `
You are a compliance advisor. Based on these license statuses, explain in plain language what the company needs to do urgently, in order of priority. Be direct and specific.

Licenses: ${JSON.stringify(licenses)}

Give a 3-5 sentence plain English summary then a prioritized action list.
    `;

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      });
      res.json({ explanation: response.content[0].text });
    } catch (aiErr) {
      console.warn("AI Explain Failed (likely missing API key), falling back to mock response.");
      res.json({ explanation: "Your compliance score is currently good, but you need to renew your upcoming licenses soon. (Mock response due to missing API key)" });
    }
  } catch (err) { next(err); }
};

module.exports = { generateChecklist, explainScore };
