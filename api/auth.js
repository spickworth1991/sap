
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Use environment variable for the secret key
const SECRET_KEY = process.env.SECRET_KEY;

// Original user data with spreadsheet IDs
const users = [
    { username: 'spickworth', password: bcrypt.hashSync('admin123', 10), role: 'admin', spreadsheetId: '19ernax6WLojBLh1OOBaU6IcDuKFxwLB4FL6pNVpqrGI' },
    { username: 'user1', password: bcrypt.hashSync('user123', 10), role: 'user', spreadsheetId: '1RzOAQmsdoWw3Df5G0625RlCpySZpEXx39oAnf0YM4PE' },
    { username: 'user2', password: bcrypt.hashSync('user123', 10), role: 'user', spreadsheetId: '1bu86Ld2p1BCXf-wubb9yW26KMigqdZldIeCt_ho12ss' },
];

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT with spreadsheet ID
    const token = jwt.sign(
        { username: user.username, role: user.role, spreadsheetId: user.spreadsheetId },
        SECRET_KEY,
        { expiresIn: '1h' }
    );
    res.json({ token });
});

module.exports = router;
