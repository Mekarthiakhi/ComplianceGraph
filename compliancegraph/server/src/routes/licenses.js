const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { addLicense, getLicenses, getApplicableLicenses, updateLicenseStatus } = require('../controllers/licenseController');

router.post('/', authMiddleware, addLicense);
router.get('/:companyId', authMiddleware, getLicenses);
router.get('/:companyId/applicable', authMiddleware, getApplicableLicenses);
router.patch('/:licenseId/status', authMiddleware, updateLicenseStatus);

module.exports = router;
