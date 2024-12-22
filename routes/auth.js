const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByUsername } = require('../api/users');

// Use environment variable for the secret key
const SECRET_KEY = process.env.SECRET_KEY;

//console.log('SECRET_KEY:', process.env.SECRET_KEY ? 'Loaded' : 'Not Loaded');

// Login route
router.post('/login', async (req, res) => {
    //console.log('POST /login called');
    //console.log('Request body:', req.body);

    const { username, password } = req.body;
    const user = findUserByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        console.log('Invalid username or password');
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT with spreadsheet ID
    const token = jwt.sign(
        { username: user.username, role: user.role, spreadsheetId: user.spreadsheetId },
        SECRET_KEY,
        { expiresIn: '1h' }
    );
    console.log('Login successful:', { username });
    res.json({ token });
});

module.exports = router;
