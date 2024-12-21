
// routes/sap.js
const express = require('express');
const router = express.Router();
const { getGoogleSheetsService, appendRow } = require('../utils/googleSheetsUtils');

router.post('/input', async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.spreadsheetId;
        const { input } = req.body;
        if (!input) return res.status(400).json({ error: 'Input is required.' });
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString();
        await appendRow(sheets, spreadsheetId, 'SAP!A:E', [date, time, input]);
        res.status(200).json({ message: 'SAP input recorded.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to record SAP input.' });
    }
});

module.exports = router;
