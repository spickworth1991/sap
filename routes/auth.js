// Import modules (using ES Modules syntax)
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByUsername } from '../api/users.js';

// Create the router instance
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

// User details route
router.get('/user-details', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await findUserByUsername(decoded.username);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                username: user.username,
                role: user.role,
                spreadsheetId: user.spreadsheetId,
            },
        });
    } catch (error) {
        console.error('Error decoding token:', error);
        res.status(403).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router;