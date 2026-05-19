const neo4j = require('neo4j-driver');

let driver = null;
try {
  driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'password'),
    { maxConnectionLifetime: 3000, maxConnectionPoolSize: 50, connectionTimeout: 2000 }
  );
} catch (e) {
  console.warn('Failed to initialize Neo4j driver (syntax/url error).');
}

const getSession = () => driver ? driver.session() : null;

// IN-MEMORY MOCK DB FOR DEMO IF NEO4J IS OFFLINE
const mockDb = {
  companies: [],
  licenses: []
};

const runQuery = async (cypher, params = {}) => {
  let session;
  try {
    if (!driver) throw new Error("No driver instantiated");
    session = getSession();
    const result = await session.run(cypher, params);
    return result.records;
  } catch (err) {
    console.warn(`Neo4j Query Failed. Using in-memory fallback for demo. Error: ${err.message.substring(0, 50)}...`);
    
    // MOCK: Onboard Company
    if (cypher.includes('MERGE (c:Company {companyId: $companyId})') && cypher.includes('SET c.name')) {
      const c = { ...params };
      mockDb.companies.push(c);
      return [{ get: () => ({ properties: c }) }];
    }
    
    // MOCK: Get Company By UID
    if (cypher.includes('MATCH (c:Company {firebaseUid: $uid})')) {
      const c = mockDb.companies.find(x => x.firebaseUid === params.uid);
      return c ? [{ get: () => ({ properties: c }) }] : [];
    }

    // MOCK: Add License
    if (cypher.includes('CREATE (l:License {') && cypher.includes('licenseId: $licenseId')) {
      mockDb.licenses.push({
        ...params,
        companyId: params.companyId
      });
      return []; // Doesn't expect return for addLicense
    }

    // MOCK: Get Licenses
    if (cypher.includes('MATCH (c:Company {companyId: $companyId})-[:HOLDS]->(l:License)')) {
      if (cypher.includes('RETURN l, lt, r')) {
        const companyLicenses = mockDb.licenses.filter(l => l.companyId === params.companyId);
        return companyLicenses.map(l => ({
          get: (key) => {
            if (key === 'l') return { properties: l };
            if (key === 'lt') return { properties: { name: l.licenseTypeName || l.finalTypeId, penaltySeverity: 'medium' } };
            if (key === 'r') return null;
          }
        }));
      }
      
      // getComplianceScore mock (also uses holds license match)
      if (cypher.includes('complianceScore')) {
        return [{
          get: (key) => {
            if (key === 'score') return 1.0;
            if (key === 'total') return mockDb.licenses.length;
            if (key === 'expired') return 0;
            if (key === 'critical') return 0;
          }
        }];
      }
    }

    // MOCK: Get Applicable Licenses
    if (cypher.includes('WHERE c.industryType IN lt.applicableTo') || cypher.includes('WHERE $industryType IN lt.applicableTo')) {
      return [{
        get: (key) => {
          if (key === 'lt') return { properties: { licenseTypeId: 'FACTORY_LICENSE_TG', name: 'Factory License (Mock)', penaltySeverity: 'high' } };
          if (key === 'l') return null;
        }
      }];
    }

    // MOCK: Graph View - getCompanyGraph
    if (cypher.includes('RETURN l, lt, collect({type: dep, rel: req}) AS dependencies')) {
      const companyLicenses = mockDb.licenses.filter(l => l.companyId === params.companyId);
      return companyLicenses.map(l => ({
        get: (key) => {
          if (key === 'l') return { properties: l };
          if (key === 'lt') return { properties: { name: l.licenseTypeName || l.finalTypeId, shortCode: l.finalTypeId, penaltySeverity: 'medium' } };
          if (key === 'dependencies') return []; // Simple mock has no dependencies
        }
      }));
    }

    // MOCK: Graph View - Graph Stats
    if (cypher.includes('RETURN count(*) AS totalEdges')) {
      return [{ get: () => ({ toNumber: () => 0 }) }];
    }
    if (cypher.includes('RETURN count(lt) AS count')) {
      return [{ get: () => ({ toNumber: () => mockDb.licenses.length }) }];
    }

    // MOCK: Graph View - getBlockers
    if (cypher.includes('length(path) AS depth')) {
      return []; // Return empty blockers list for mock
    }

    // MOCK: AI Checklist - generateChecklist
    if (cypher.includes('RETURN c, l, lt, r, collect(distinct d.name) AS docs, collect(distinct dep.name) AS prereqs')) {
      const l = mockDb.licenses.find(x => x.companyId === params.companyId && x.finalTypeId === params.licenseTypeId);
      if (!l) return [];
      const c = mockDb.companies.find(x => x.companyId === params.companyId) || { name: 'Mock Company', industryType: 'pharma', state: 'telangana' };
      return [{
        get: (key) => {
          if (key === 'c') return { properties: c };
          if (key === 'l') return { properties: l };
          if (key === 'lt') return { properties: { name: l.licenseTypeName || l.finalTypeId, governingAct: 'Regulatory Mock Act' } };
          if (key === 'r') return null;
          if (key === 'docs') return ['Identity Proof', 'Incorporation Certificate'];
          if (key === 'prereqs') return [];
        }
      }];
    }
    
    // Return empty array for any other unmocked queries to prevent crashing
    return [];
  } finally {
    if (session) await session.close();
  }
};

module.exports = { driver, getSession, runQuery };
