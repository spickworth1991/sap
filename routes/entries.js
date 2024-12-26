

// Import modules (using ES Modules syntax)
import express from 'express';
import { getGoogleSheetsService } from '../utils/googleSheetsUtils.js';

// Create the router instance
const router = express.Router();



router.get('/:date', async (req, res) => {
  // Extract headers
  const { spreadsheetId, username, role, inputText } = req.body;
  const authHeader = req.headers.authorization;
  //console.log(`spreadsheetId: ${spreadsheetId}`);
    try {
    
      // Validate data
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }
      if (!spreadsheetId || !username || !role) {
          return res.status(400).json({ error: 'Required data missing in request body' });
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
        res.status(500).json({errors : "Failed to fetch entries"});
      }
});

router.get('/api/entries/:date', async (req, res) => {
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
    res.status(500).json({errors : "Failed to fetch entries"});
  }
});

export default router;
