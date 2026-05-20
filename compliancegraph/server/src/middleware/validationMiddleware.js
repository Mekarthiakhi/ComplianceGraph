/**
 * Input Validation Middleware
 * Comprehensive request validation and sanitization
 */

const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/appError');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    throw new ValidationError('Request validation failed', formattedErrors);
  }
  next();
};

// Validation rules for common fields
const rules = {
  email: () => body('email').isEmail().normalizeEmail(),
  password: () => body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  companyId: () => param('companyId').isString().trim().notEmpty(),
  licenseId: () => param('licenseId').isString().trim().notEmpty(),
  licenseTypeId: () => body('licenseTypeId').isString().trim().notEmpty(),
  expiryDate: () => body('expiryDate')
    .isISO8601()
    .withMessage('Expiry date must be in ISO 8601 format (YYYY-MM-DD)')
    .toDate(),
  issueDate: () => body('issueDate')
    .isISO8601()
    .withMessage('Issue date must be in ISO 8601 format (YYYY-MM-DD)')
    .toDate(),
  licenseNumber: () => body('licenseNumber').isString().trim().notEmpty().isLength({ max: 50 }),
  phone: () => body('phone').isMobilePhone('en-IN').withMessage('Invalid Indian phone number'),
  gstin: () => body('gstin').matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
  employeeCount: () => body('employeeCount').isInt({ min: 1 }).toInt(),
};

// Composite validators for common operations
const validators = {
  // License validation
  addLicense: [
    body('companyId').isString().trim().notEmpty(),
    body('licenseTypeId').isString().trim().notEmpty(),
    body('licenseNumber').isString().trim().notEmpty().isLength({ max: 100 }),
    body('issueDate').isISO8601().toDate(),
    body('expiryDate').isISO8601().toDate(),
    body('notes').optional().isString().trim(),
    validateRequest,
  ],

  // Company registration
  registerCompany: [
    body('name').isString().trim().notEmpty().isLength({ min: 2, max: 255 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').isMobilePhone('en-IN'),
    body('industryType').isIn(['pharma', 'chemical', 'food', 'textile', 'manufacturing']),
    body('employeeCount').isInt({ min: 1 }).toInt(),
    body('gstin').matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
    validateRequest,
  ],

  // License status update
  updateLicenseStatus: [
    param('licenseId').isString().trim().notEmpty(),
    body('status').isIn(['active', 'expired', 'suspended', 'pending_renewal']),
    body('notes').optional().isString().trim(),
    validateRequest,
  ],

  // Payment verification
  verifyPayment: [
    body('razorpay_order_id').isString().trim().notEmpty(),
    body('razorpay_payment_id').isString().trim().notEmpty(),
    body('razorpay_signature').isString().trim().notEmpty(),
    body('companyId').isString().trim().notEmpty(),
    body('plan').isIn(['starter', 'professional', 'enterprise']),
    validateRequest,
  ],

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validateRequest,
  ],
};

module.exports = {
  validateRequest,
  rules,
  validators,
};
