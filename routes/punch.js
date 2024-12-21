
// routes/punch.js
const express = require('express');
const router = express.Router();
const { getGoogleSheetsService, appendRow } = require('../utils/googleSheetsUtils');

router.post('/in', async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.spreadsheetId;
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString();
        await appendRow(sheets, spreadsheetId, 'Logs!A:E', [date, time, 'Punch In']);
        res.status(200).json({ message: 'Punched in successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to punch in.' });
    }
});

module.exports = router;
