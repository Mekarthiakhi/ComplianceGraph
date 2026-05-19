const twilio = require('twilio');
const { runQuery } = require('../config/neo4j');

let twilioClient;
const getTwilioClient = () => {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !sid.startsWith('AC')) {
      console.warn('⚠️ Twilio is not configured properly (TWILIO_ACCOUNT_SID does not start with AC). WhatsApp alerts will fail.');
      return null;
    }
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
};

const sendWhatsAppAlert = async (to, message) => {
  const client = getTwilioClient();
  if (!client) {
    console.warn(`⚠️ Skipped WhatsApp alert to ${to} (Twilio not configured)`);
    return;
  }
  return client.messages.create({
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
      const d = {
        company: r.get('company'),
        phone: r.get('phone'),
        licenseName: r.get('licenseName'),
        expiry: r.get('expiry'),
        penalty: r.get('penalty'),
      };
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
