const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { getCompanyGraph, getBlockers, getGraphStats } = require('../controllers/graphController');

router.get('/stats/overview', getGraphStats);
router.get('/:companyId', authMiddleware, getCompanyGraph);
router.get('/:companyId/blockers/:licenseTypeId', authMiddleware, getBlockers);

module.exports = router;
