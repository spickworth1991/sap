const express = require('express');
const router = express.Router();

let logs = [];
let entries = [];
let users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'user', password: 'user123', role: 'user' }
];

router.get('/logs', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.json(logs);
    } else {
        res.status(403).json({ success: false, message: 'Access denied' });
    }
});

router.get('/users', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.json(users);
    } else {
        res.status(403).json({ success: false, message: 'Access denied' });
    }
});

module.exports = router;