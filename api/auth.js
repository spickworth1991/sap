const express = require('express');
const router = express.Router();

// Placeholder user data with spreadsheet IDs
const users = [
    { username: 'admin', password: 'admin123', role: 'admin', spreadsheetId: 'admin-spreadsheet-id' },
    { username: 'user1', password: 'user123', role: 'user', spreadsheetId: 'user1-spreadsheet-id' },
    { username: 'user2', password: 'user123', role: 'user', spreadsheetId: 'user2-spreadsheet-id' }
];

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ success: true, role: user.role, spreadsheetId: user.spreadsheetId });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

module.exports = router;