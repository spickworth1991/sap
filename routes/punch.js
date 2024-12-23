// Import modules (using ES Modules syntax)
import express from 'express';
import { getCurrentTime, getCurrentDate, formatElapsedTime, getGoogleSheetsService } from '../utils/googleSheetsUtils.js';
import { ensureAuthenticated } from '../middleware/validate.js';
import { getCurrentMonthName, findDateRow, formatElapsedTime, calculateElapsedTimeDecimal } from '../utils/googleSheetsUtils.js';
import { logAction } from '../middleware/log.js';

// Create the router instance
const router = express.Router();


// Punch-in route
router.post('/in', logAction, ensureAuthenticated, findDateRow, async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const monthSheetName = monthName;
        const sapSheetName = `${monthName}:SAP`;
    
        // Ensure headers are present in the SAP sheet
        await ensureHeaders(sheets, sapSheetName, currentDate);
    
        // Find the row with the current date on the month sheet
        let rowIndex = await findDateRow(sheets, monthSheetName, currentDate);
    
        if (!rowIndex) {
          return res.status(400).json(errors.NO_ENTRY_FOUND);
        }
    
        // Check if Punch In time already exists in Column C
        const punchInResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${monthSheetName}!C${rowIndex}`,
        });
        if (punchInResponse.data.values?.[0]?.[0]) {
          return res.status(400).json(errors.PUNCH_IN_EXISTS);
        }
    
        // Update the Punch In time in Column C on the month sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${monthSheetName}!C${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[currentTime]] },
        });
    
        // Add Punch In entry to the SAP sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sapSheetName}!A:E`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[currentDate, currentTime, 'Punch In', '', '']] },
        });
    
        res.status(200).json(success.PUNCH_IN_SUCCESS );
      } catch (error) {
        console.error('Error in Punch In:', error);
        res.status(500).json(errors.FAIL_PUNCH_IN);
      }
    });

// Punch-out route
router.post('/out', calculateElapsedTimeDecimal, logAction, ensureAuthenticated, getCurrentMonthName, getCurrentTime, getCurrentDate, formatElapsedTime,  async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const monthSheetName = monthName;
        const sapSheetName = `${monthName}:SAP`;
    
        // Find the row with the current date on the month sheet
        let rowIndex = await findDateRow(sheets, monthSheetName, currentDate);
    
        if (!rowIndex) {
          return res.status(400).json(errors.NO_ENTRY_FOUND);
        }
    
        // Check if Punch Out time already exists in Column E
        const punchOutResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${monthSheetName}!E${rowIndex}`,
        });
        if (punchOutResponse.data.values?.[0]?.[0]) {
          return res.status(400).json(errors.PUNCH_OUT_EXISTS);
        }
    
        // Check if Punch In time exists in Column C
        const punchInResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${monthSheetName}!C${rowIndex}`,
        });
        const punchInTime = punchInResponse.data.values?.[0]?.[0];
    
        if (!punchInTime) {
          return res.status(400).json(errors.NO_PUNCH_IN_FOUND);
        }
    
        // Update the Punch Out time in Column E on the month sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${monthSheetName}!E${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[currentTime]] },
        });
    
        // Fetch the last row number on the SAP sheet
        const sapDataResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sapSheetName}!B:B`,
        });
        const lastRow = sapDataResponse.data.values ? sapDataResponse.data.values.length : 1;
    
        // Get the previous row's time
        const previousTimeResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sapSheetName}!B${lastRow}`,
        });
        const previousTime = previousTimeResponse.data.values?.[0]?.[0];
    
        // Calculate elapsed time and SAP time
        if (previousTime) {
          const previousDateTime = moment.tz(`${currentDate} ${previousTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
          const now = moment.tz(`${currentDate} ${currentTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
          const elapsedMilliseconds = now.diff(previousDateTime);
          const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
          const elapsedDecimal = calculateElapsedTimeDecimal(elapsedMilliseconds);
    
          // Update the previous row with elapsed time and SAP time
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sapSheetName}!D${lastRow}:E${lastRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
          });
        }
    
        // Add Punch Out entry to the SAP sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sapSheetName}!A:E`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[currentDate, currentTime, 'Punch Out', '', '']] },
        });
    
        // Calculate totals for the current date
        const updatedSapDataResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sapSheetName}!A:E`,
        });
    
        const sapData = updatedSapDataResponse.data.values || [];
        let totalElapsedTime = 0;
        let totalSapTime = 0;
    
        for (const row of sapData) {
          if (row[0] === currentDate && row[3] && row[4]) {
            const [hours, minutes, seconds] = row[3].split(':').map(Number);
            totalElapsedTime += hours * 3600 + minutes * 60 + seconds;
            totalSapTime += parseFloat(row[4]);
          }
        }
    
        const totalElapsedFormatted = formatElapsedTime(totalElapsedTime * 1000);
        const totalSapTimeFormatted = totalSapTime.toFixed(4);
    
        // Append Totals row to the SAP sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sapSheetName}!A:E`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [['', '', 'Totals', totalElapsedFormatted, totalSapTimeFormatted]] },
        });
    
        res.status(200).json(success.PUNCH_OUT_SUCCESS);
      } catch (error) {
        console.error('Error in Punch Out:', error);
        res.status(500).json(errors.FAIL_PUNCH_OUT );
      }
    });

export default router;
