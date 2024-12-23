
const express = require('express');
const { tokenMiddleware } = require('../middleware/tokenMiddleware');
const router = express.Router();

router.use(tokenMiddleware); // Apply the middleware

// Example route
router.get('/user-details', (req, res) => {
    if (req.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

module.exports = router;
