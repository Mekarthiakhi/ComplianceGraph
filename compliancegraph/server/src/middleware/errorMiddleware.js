const logger = require('../utils/logger')('ErrorMiddleware');
const { AppError, DatabaseError } = require('../utils/appError');

/**
 * Comprehensive Error Handling Middleware
 * Catches all errors and provides consistent response format
 */
const errorMiddleware = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled Error', {
    error: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle known AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Neo4j specific errors
  if (err.name === 'Neo4jError' || err.constructor.name === 'Neo4jError') {
    logger.error('Neo4j Error', { message: err.message, code: err.code });

    if (err.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
      return res.status(409).json({
        error: {
          code: 'CONSTRAINT_VIOLATION',
          message: 'This record already exists or violates database constraints',
          statusCode: 409,
        },
      });
    }

    if (err.code === 'Neo.ClientError.Database.DatabaseUnavailable') {
      return res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database is temporarily unavailable. Please try again later.',
          statusCode: 503,
        },
      });
    }

    return res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
        statusCode: 500,
      },
    });
  }

  // Handle Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    const statusCode = err.code === 'auth/invalid-credential' ? 401 : 400;
    return res.status(statusCode).json({
      error: {
        code: err.code,
        message: err.message || 'Authentication error',
        statusCode,
      },
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details || [],
        statusCode: 400,
      },
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        statusCode: 400,
      },
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred'
        : err.message || 'Internal server error',
      statusCode,
    },
  });
};

/**
 * Async error wrapper for Express route handlers
 * Catches errors in async functions and passes to error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorMiddleware, asyncHandler };
