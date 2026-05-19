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

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ComplianceGraph server running on port ${PORT}`));
