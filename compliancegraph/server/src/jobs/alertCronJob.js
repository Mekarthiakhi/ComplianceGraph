const cron = require('node-cron');
const { runDailyAlerts } = require('../controllers/alertController');

// Run every day at 8:00 AM IST (UTC+5:30 = 02:30 UTC)
cron.schedule('30 2 * * *', async () => {
  console.log('Running scheduled compliance alerts — 8AM IST');
  try {
    await runDailyAlerts();
  } catch (err) {
    console.error('Cron alert error:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

console.log('Alert cron job scheduled — fires daily at 8:00 AM IST');
