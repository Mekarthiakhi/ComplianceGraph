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
        nodes.push({
          id: lt.shortCode,
          label: lt.name,
          status: l.status,
          daysToExpiry: l.daysToExpiry,
          severity: lt.penaltySeverity
        });
        seen.add(lt.shortCode);
      }
      r.get('dependencies').forEach(dep => {
        if (dep.type) {
          const depProps = dep.type.properties;
          if (!seen.has(depProps.shortCode)) {
            nodes.push({
              id: depProps.shortCode,
              label: depProps.name,
              status: 'dependency',
              severity: depProps.penaltySeverity
            });
            seen.add(depProps.shortCode);
          }
          edges.push({
            from: lt.shortCode,
            to: depProps.shortCode,
            mandatory: dep.rel?.properties?.mandatory
          });
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

    const blockers = records.map(r => ({
      name: r.get('name'),
      shortCode: r.get('shortCode'),
      status: r.get('status'),
      expiryDate: r.get('expiryDate'),
      depth: r.get('depth').toNumber ? r.get('depth').toNumber() : r.get('depth'),
    }));
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
