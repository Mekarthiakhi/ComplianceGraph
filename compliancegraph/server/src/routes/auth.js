const router = require('express').Router();

// Auth routes — Firebase handles auth client-side; this route can be used for server-side validation
router.get('/verify', require('../middleware/authMiddleware').authMiddleware, (req, res) => {
  res.json({ uid: req.user.uid, email: req.user.email });
});

module.exports = router;
