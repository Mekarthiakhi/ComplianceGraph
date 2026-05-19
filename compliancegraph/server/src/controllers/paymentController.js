const Razorpay = require('razorpay');
const crypto = require('crypto');
const { runQuery } = require('../config/neo4j');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  starter:      { amount: 500000,  name: 'Starter — ₹5,000/month',      months: 1  },
  professional: { amount: 1200000, name: 'Professional — ₹12,000/quarter', months: 3  },
  enterprise:   { amount: 4000000, name: 'Enterprise — ₹40,000/year',    months: 12 },
};

const createOrder = async (req, res, next) => {
  try {
    const { companyId, plan } = req.body;
    const selectedPlan = PLANS[plan];
    if (!selectedPlan) return res.status(400).json({ error: 'Invalid plan' });

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: 'INR',
      receipt: `cg_${companyId}_${Date.now()}`,
      notes: { companyId, plan }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, planName: selectedPlan.name });
  } catch (err) { next(err); }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, companyId, plan } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const selectedPlan = PLANS[plan];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + selectedPlan.months);

    await runQuery(`
      MATCH (c:Company {companyId: $companyId})
      SET c.subscriptionStatus = 'active',
          c.subscriptionPlan = $plan,
          c.subscriptionExpiresAt = $expiresAt,
          c.lastPaymentId = $paymentId
    `, { companyId, plan, expiresAt: expiresAt.toISOString(), paymentId: razorpay_payment_id });

    res.json({ success: true, subscriptionValidUntil: expiresAt });
  } catch (err) { next(err); }
};

module.exports = { createOrder, verifyPayment };
