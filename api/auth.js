const express = require('express');
const router = express.Router();

// Placeholder user data with spreadsheet IDs
const users = [
    { username: 'admin', password: 'admin123', role: 'admin', spreadsheetId: '19ernax6WLojBLh1OOBaU6IcDuKFxwLB4FL6pNVpqrGI' },
    { username: 'user1', password: 'user123', role: 'user', spreadsheetId: '1RzOAQmsdoWw3Df5G0625RlCpySZpEXx39oAnf0YM4PE' },
    { username: 'spickworth', password: 'test', role: 'admin', spreadsheetId: '1bu86Ld2p1BCXf-wubb9yW26KMigqdZldIeCt_ho12ss' }
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