const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { generateChecklist, explainScore } = require('../controllers/aiController');

router.post('/checklist', authMiddleware, generateChecklist);
router.get('/explain/:companyId', authMiddleware, explainScore);

module.exports = router;
