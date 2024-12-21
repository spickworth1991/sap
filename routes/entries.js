
// routes/entries.js
const express = require('express');
const router = express.Router();
const { getGoogleSheetsService, getSheetData } = require('../utils/googleSheetsUtils');

router.get('/:date', async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.spreadsheetId;
        const date = req.params.date;
        const monthName = new Date(date).toLocaleString('en-US', { month: 'long' });
        const sheetName = `${monthName}:SAP`;
        const entries = await getSheetData(sheets, spreadsheetId, `${sheetName}!A:E`);
        res.status(200).json({ entries });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch entries.' });
    }
});

module.exports = router;
