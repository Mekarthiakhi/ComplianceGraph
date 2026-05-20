require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger')('App');
const { errorMiddleware, asyncHandler } = require('./middleware/errorMiddleware');
const {
  apiLimiter,
  authLimiter,
  securityHeaders,
  corsOptions,
  requestLogger,
  sanitizeRequest,
} = require('./middleware/securityMiddleware');
const { healthCheck } = require('./config/neo4j');

// Initialize app
const app = express();

// ============================================================================
// SECURITY & MIDDLEWARE STACK
// ============================================================================

// Trust proxy - important for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ limit: '10kb', extended: false }));

// Request sanitization
app.use(sanitizeRequest);

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint (no rate limiting)
app.get('/api/health', asyncHandler(async (req, res) => {
  const dbHealth = await healthCheck();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: dbHealth,
  });
}));

// Authentication routes with strict rate limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));

// Protected routes with standard rate limiting
app.use('/api/companies', apiLimiter, require('./routes/companies'));
app.use('/api/licenses', apiLimiter, require('./routes/licenses'));
app.use('/api/graph', apiLimiter, require('./routes/graph'));
app.use('/api/ai', apiLimiter, require('./routes/ai'));
app.use('/api/alerts', apiLimiter, require('./routes/alerts'));
app.use('/api/payments', apiLimiter, require('./routes/payments'));

// ============================================================================
// 404 & ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
});

// Global error handler (must be last)
app.use(errorMiddleware);

// ============================================================================
// STARTUP
// ============================================================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  logger.info('ComplianceGraph server started', {
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Logs available in: ./logs/app.log\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: String(reason),
    promise: String(promise),
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
