/**
 * Security Middleware
 * Implements rate limiting, request sanitization, and other security measures
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger')('Security');
const { RateLimitError } = require('../utils/appError');

/**
 * Global rate limiter for API endpoints
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.uid || req.ip;
  },
  handler: (req, res, next) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      uid: req.user?.uid,
    });
    next(new RateLimitError(60));
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => req.body?.email || req.ip,
  handler: (req, res, next) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
    });
    next(new RateLimitError(900));
  },
});

/**
 * Payment operation limiter
 * Prevent double-charging
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2,
  message: 'Too many payment requests, please wait before trying again',
  keyGenerator: (req) => req.user?.uid,
  handler: (req, res, next) => {
    logger.warn('Payment rate limit exceeded', {
      uid: req.user?.uid,
    });
    next(new RateLimitError(60));
  },
});

/**
 * Request sanitization middleware
 * Removes suspicious characters and SQL injection attempts
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key]
        .replace(/[<>]/g, '') // Remove angle brackets
        .trim();
    }
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

/**
 * Recursively sanitize object values
 */
const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/['";]/g, '') // Remove quotes and semicolons
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.anthropic.com https://api.razorpay.com"
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * CORS configuration
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    uid: req.user?.uid,
    userAgent: req.get('user-agent')?.substring(0, 100),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      uid: req.user?.uid,
    });
  });

  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  sanitizeRequest,
  securityHeaders,
  corsOptions,
  requestLogger,
};
