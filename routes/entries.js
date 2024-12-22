
// routes/entries.js
const express = require('express');
const router = express.Router();
const { getGoogleSheetsService, getSheetData } = require('../utils/googleSheetsUtils');

router.get('/:date', async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.headers['spreadsheet-id']; // Extract spreadsheetId from request headers
    
        if (!spreadsheetId) {
          return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
        }
    
        const selectedDate = req.params.date; // Date in MM/DD/YYYY format
        const monthName = moment(selectedDate, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
        const sapSheetName = `${monthName}:SAP`;
    
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sapSheetName}!A:E`,
        });
    
        const allEntries = response.data.values || [];
        const dateEntries = allEntries
          .map((row, index) => ({ rowNumber: index + 1, values: row }))
          .filter(row => row.values[0] === selectedDate);
    
        // Only one response should be sent
        res.status(200).json({ entries: dateEntries });
      } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json(errors.FETCH_FAIL);
      }
    });

    app.get('/api/entries/:date', async (req, res) => {
      try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.headers['spreadsheet-id']; // Extract spreadsheetId from request headers
    
        if (!spreadsheetId) {
          return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
        }
    
        const selectedDate = req.params.date; // Date in MM/DD/YYYY format
        const monthName = moment(selectedDate, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
        const sapSheetName = `${monthName}:SAP`;
    
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sapSheetName}!A:E`,
        });
    
        const allEntries = response.data.values || [];
        const dateEntries = allEntries
          .map((row, index) => ({ rowNumber: index + 1, values: row }))
          .filter(row => row.values[0] === selectedDate);
    
        // Only one response should be sent
        res.status(200).json({ entries: dateEntries });
      } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json(errors.FETCH_FAIL);
      }
    });

module.exports = router;
