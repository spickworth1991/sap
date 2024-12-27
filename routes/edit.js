// Import modules (using ES Modules syntax)
import express from 'express';
import moment from 'moment-timezone';
import {
    getGoogleSheetsService,
    ensureHeaders,
    findDateRow,
    getCurrentTime,
    getCurrentDate,
    calculateElapsedTimeDecimal,
    formatElapsedTime,
    getCurrentMonthName,
} from '../utils/googleSheetsUtils.js';

// Create the router instance
const router = express.Router();
router.post('/edit',  async (req, res) => {
    try {
      const { username, role, spreadsheetId, date, rowNumber, newTime, newProjectActivity } = req.body;
      const sheets = await getGoogleSheetsService();
      console.log(rowNumber);

      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
      }
      const monthName = moment(date, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
      const sapSheetName = `${monthName}:SAP`;
      

      

   

      // 1. Update the specified row with the new time and project/activity
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sapSheetName}!B${rowNumber}:C${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[newTime, newProjectActivity]] },
      });
  
      // 2. Fetch the updated sheet data to recalculate elapsed times and SAP times
      let sapDataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sapSheetName}!A:E`,
      });
  
      let sapData = sapDataResponse.data.values || [];
  
      // Find all rows with the same date
      let dateRows = sapData
        .map((row, index) => ({ index: index + 1, row }))
        .filter(item => item.row[0] === date);
        //console.log(dateRows);
  
      // Recalculate elapsed times and SAP times for each row and update the previous row
      for (let i = 1; i < dateRows.length; i++) {
        const currentRow = dateRows[i];
        const previousRow = dateRows[i - 1];
  
        const previousTime = previousRow.row[1];
        const currentTime = currentRow.row[1];
  
        if (previousTime && currentTime) {
          const previousDateTime = moment.tz(`${date} ${previousTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
          const currentDateTime = moment.tz(`${date} ${currentTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
          const elapsedMilliseconds = currentDateTime.diff(previousDateTime);
          const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
          const elapsedDecimal = calculateElapsedTimeDecimal(elapsedMilliseconds);
  
          // Update the previous row's elapsed time and SAP time
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sapSheetName}!D${previousRow.index}:E${previousRow.index}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
          });
        }
      }
  
      // 3. Fetch the updated sheet data again after recalculations
      let updatedSapDataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sapSheetName}!A:E`,
      });
  
      let updatedSapData = updatedSapDataResponse.data.values || [];
  
      // Create fresh dateRows with the updated data
      let dateRowsNew = updatedSapData
        .map((row, index) => ({ index: index + 1, row }))
        .filter(item => item.row[0] === date);
        //console.log(dateRowsNew);
  
      // 4. Recalculate totals for the current date
      let lastRowWithDate = dateRowsNew[dateRowsNew.length - 1].index;
      let totalsRowIndex = null;
      //console.log(`last row with date:${lastRowWithDate}`);
  
      // Find the "Totals" row in the last row with the current date
      for (let i = lastRowWithDate; i >= 1; i--) {
        const row = updatedSapData[i - 1];
        if (row && row[2] === 'Totals') {
          totalsRowIndex = i;
          //console.log(`total row index: ${totalsRowIndex}`);  
          break;
        }
      }
  
      // If a totals row is found, recalculate and update the totals
      if (totalsRowIndex) {
        let totalElapsedTime = 0;
        let totalSapTime = 0;
  
        dateRowsNew.forEach(row => {
          // Skip the "Totals" row
          if (row.index === totalsRowIndex) {
            return;
          }

          const elapsedTime = row.row[3];
          const sapTime = row.row[4];
  
          if (elapsedTime && sapTime) {
            const [hours, minutes, seconds] = elapsedTime.split(':').map(Number);
            totalElapsedTime += hours * 3600 + minutes * 60 + seconds;
            totalSapTime += parseFloat(sapTime);
          }
        });
  
        const totalElapsedFormatted = formatElapsedTime(totalElapsedTime * 1000);
        const totalSapTimeFormatted = totalSapTime.toFixed(4);
        //console.log(`total elapsed formated: ${totalElapsedFormatted}`);
        //console.log(`total sap formatted: ${totalSapTimeFormatted}`);
  
        // Update the totals row with recalculated totals
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sapSheetName}!D${totalsRowIndex}:E${totalsRowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[totalElapsedFormatted, totalSapTimeFormatted]] },
        });
      }
  
      res.status(200).json({ message : "Edit successful"});
    } catch (error) {
      console.error('Error in editing entry:', error);
      res.status(500).json({message : "Edit failed"});
    }
  });

export default router;
