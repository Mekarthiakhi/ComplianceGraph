const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

router.post('/order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);

module.exports = router;
