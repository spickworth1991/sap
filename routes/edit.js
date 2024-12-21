
const express = require('express');
const router = express.Router();
const { editEntry } = require('../utils/googleSheetsUtils');

router.post('/', editEntry, logAction, async (req, res) => {
    try {
      const { date, rowIndex, time, projectActivity } = req.body;
      const sheets = await getGoogleSheetsService();
      const spreadsheetId = req.headers['spreadsheet-id']; // Extract spreadsheetId from request headers
  
      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
      }
      const monthName = moment(date, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
      const sapSheetName = `${monthName}:SAP`;
  
      // 1. Update the specified row with the new time and project/activity
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sapSheetName}!B${rowIndex}:C${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[time, projectActivity]] },
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
      dateRows = updatedSapData
        .map((row, index) => ({ index: index + 1, row }))
        .filter(item => item.row[0] === date);
  
      // 4. Recalculate totals for the current date
      let lastRowWithDate = dateRows[dateRows.length - 1].index;
      let totalsRowIndex = null;
  
      // Find the "Totals" row after the last row with the current date
      for (let i = lastRowWithDate + 1; i <= updatedSapData.length; i++) {
        const row = updatedSapData[i - 1];
        if (row && row[2] === 'Totals') {
          totalsRowIndex = i;
          break;
        }
      }
  
      // If a totals row is found, recalculate and update the totals
      if (totalsRowIndex) {
        let totalElapsedTime = 0;
        let totalSapTime = 0;
  
        dateRows.forEach(row => {
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
  
        // Update the totals row with recalculated totals
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sapSheetName}!D${totalsRowIndex}:E${totalsRowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[totalElapsedFormatted, totalSapTimeFormatted]] },
        });
      }
  
      res.status(200).json(success.ENTRY_UPDATED_SUCCESS);
    } catch (error) {
      console.error('Error in editing entry:', error);
      res.status(500).json(errors.UPDATE_FAILED);
    }
  });

module.exports = router;
