const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendTestAlert } = require('../controllers/alertController');

router.post('/test', authMiddleware, sendTestAlert);

module.exports = router;
