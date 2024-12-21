
const express = require('express');
const router = express.Router();
const { sapInput } = require('../utils/googleSheetsUtils');

router.post('/input', sapInput, logAction, async (req, res) => {
    try {
      const { input } = req.body;
      if (!input) {
        return res.status(400).json(errors.NO_INPUT_PROVIDED );
      }
  
      const sheets = await getGoogleSheetsService();
      const spreadsheetId = req.headers['spreadsheet-id']; // Extract spreadsheetId from request headers
  
      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
      }
      const currentDate = getCurrentDate();
      const currentTime = getCurrentTime();
      const monthName = getCurrentMonthName();
      const sapSheetName = `${monthName}:SAP`;
      
  
      // Fetch the last row to calculate elapsed time
      const lastRow = (await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sapSheetName}!B:B`,
      })).data.values.length;
  
      const previousTimeResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sapSheetName}!B${lastRow}`,
      });
  
      const previousTime = previousTimeResponse.data.values?.[0]?.[0];
  
      if (previousTime) {
        const previousDateTime = moment.tz(`${currentDate} ${previousTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
        const now = moment.tz(`${currentDate} ${currentTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
        const elapsedMilliseconds = now.diff(previousDateTime);
        const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
        const elapsedDecimal = calculateElapsedTimeDecimal(elapsedMilliseconds);
  
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sapSheetName}!D${lastRow}:E${lastRow}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
        });
      }
  
      // Append the new SAP input
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sapSheetName}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[currentDate, currentTime, input, '', '']] },
      });
  
      res.status(200).json(success.SAP_INPUT_SUCCESS);
    } catch (error) {
      console.error('Error in SAP Input:', error);
      res.status(500).json(errors.SAP_FAIL);
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
