
const express = require('express');
const router = express.Router();
const { getGoogleSheetsService } = require('../utils/googleSheetsUtils');
const { ensureAuthenticated } = require('../middleware/validate');
const { logAction } = require('../middleware/log');

// Apply authentication only to specific routes
router.post('/in', logAction, ensureAuthenticated, async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.spreadsheetId;

        if (!spreadsheetId) {
            return res.status(400).json({ error: 'Spreadsheet ID is missing' });
        }

        // Process punch-in logic here...

        res.status(200).json({ success: true, message: 'Punch-in successful' });
    } catch (error) {
        console.error('Error in punch-in route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
