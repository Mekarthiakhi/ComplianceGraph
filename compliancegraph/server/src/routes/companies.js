const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { onboardCompany, getCompany, getComplianceScore } = require('../controllers/companyController');

router.post('/onboard', authMiddleware, onboardCompany);
router.get('/me', authMiddleware, getCompany);
router.get('/:companyId/score', authMiddleware, getComplianceScore);

module.exports = router;
