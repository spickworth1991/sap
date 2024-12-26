// Import modules (using ES Modules syntax)
import express from 'express';
import {
    getGoogleSheetsService,
    getCurrentTime,
    getCurrentDate,
    calculateElapsedTimeDecimal,
    formatElapsedTime,
    getCurrentMonthName,
} from '../utils/googleSheetsUtils.js';

// Create the router instance
const router = express.Router();

router.post('/input', async (req, res) => {
    try {
      const { input } = req.body;
      if (!input) {
        return res.status(401).json({error : "NO_INPUT_PROVIDED" });
      }
      
      // Extract headers
      const { spreadsheetId, username, role } = req.body;
      const authHeader = req.headers.authorization;

      // Validate data
      if (!authHeader) {
          return res.status(401).json({ error: 'Authorization header missing' });
      }
      if (!spreadsheetId || !username || !role) {
          return res.status(400).json({ error: 'Required data missing in request body' });
      }


      const sheets = await getGoogleSheetsService();
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
      res.status(500).json({error : "SAP Input Failed" });
    }
  });
  

export default router;
