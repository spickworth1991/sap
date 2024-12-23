const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByUsername } = require('../api/users');
const router = express.Router();

// Use environment variable for the secret key
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await findUserByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { username: user.username, role: user.role, spreadsheetId: user.spreadsheetId },
            SECRET_KEY,
            { expiresIn: '1h' }
        );
        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;