
const express = require('express');
const router = express.Router();
const { getGoogleSheetsService } = require('../utils/googleSheetsUtils');
const { ensureAuthenticated } = require('../middleware/validate');
const { logAction } = require('../middleware/log');

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT with spreadsheet ID
    const token = jwt.sign(
        { username: user.username, role: user.role, spreadsheetId: user.spreadsheetId },
        SECRET_KEY,
        { expiresIn: '1h' }
    );
    res.json({ token });
});

module.exports = router;

router.post('/in', logAction,  ensureAuthenticated, async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.user.spreadsheetId;

        if (!spreadsheetId) {
            return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
          }
      
          const currentDate = getCurrentDate();
          const currentTime = getCurrentTime();
          const monthName = getCurrentMonthName();
          const monthSheetName = monthName;
          const sapSheetName = `${monthName}:SAP`;
      
          // Ensure headers are present in the SAP sheet
          await ensureHeaders(sheets, sapSheetName, currentDate, spreadsheetId);
      
          // Find the row with the current date on the month sheet
          let rowIndex = await findDateRow(sheets, spreadsheetId, monthSheetName, currentDate);
      
          if (!rowIndex) {
            return res.status(400).json(errors.NO_ENTRY_FOUND);
          }
      
          // Check if Punch In time already exists in Column C
          const punchInResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${monthSheetName}!C${rowIndex}`,
          });
          if (punchInResponse.data.values?.[0]?.[0]) {
            return res.status(400).json(errors.PUNCH_IN_EXISTS);
          }
      
          // Update the Punch In time in Column C on the month sheet
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${monthSheetName}!C${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentTime]] },
          });
      
          // Add Punch In entry to the SAP sheet
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sapSheetName}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentDate, currentTime, 'Punch In', '', '']] },
          });
      
          res.status(200).json(success.PUNCH_IN_SUCCESS);
        } catch (error) {
          console.error('Error in Punch In:', error);
          res.status(500).json(errors.FAIL_PUNCH_IN);
        }
      });

router.post('/out', logAction, ensureAuthenticated, async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.user.spreadsheetId;

        if (!spreadsheetId) {
            return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
          }
      
          const currentDate = getCurrentDate();
          const currentTime = getCurrentTime();
          const monthName = getCurrentMonthName();
          const monthSheetName = monthName;
          const sapSheetName = `${monthName}:SAP`;
      
          // Find the row with the current date on the month sheet
          let rowIndex = await findDateRow(sheets, spreadsheetId, monthSheetName, currentDate);
      
          if (!rowIndex) {
            return res.status(400).json(errors.NO_ENTRY_FOUND);
          }
      
          // Check if Punch Out time already exists in Column E
          const punchOutResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${monthSheetName}!E${rowIndex}`,
          });
          if (punchOutResponse.data.values?.[0]?.[0]) {
            return res.status(400).json(errors.PUNCH_OUT_EXISTS);
          }
      
          // Check if Punch In time exists in Column C
          const punchInResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${monthSheetName}!C${rowIndex}`,
          });
          const punchInTime = punchInResponse.data.values?.[0]?.[0];
      
          if (!punchInTime) {
            return res.status(400).json(errors.NO_PUNCH_IN_FOUND);
          }
      
          // Update the Punch Out time in Column E on the month sheet
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${monthSheetName}!E${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentTime]] },
          });
      
          // Fetch the last row number on the SAP sheet
          const sapDataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sapSheetName}!B:B`,
          });
          const lastRow = sapDataResponse.data.values ? sapDataResponse.data.values.length : 1;
      
          // Get the previous row's time
          const previousTimeResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
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
              spreadsheetId,
              range: `${sapSheetName}!D${lastRow}:E${lastRow}`,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
            });
          }
      
          // Add Punch Out entry to the SAP sheet
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sapSheetName}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentDate, currentTime, 'Punch Out', '', '']] },
          });
      
          // Calculate totals for the current date
          const updatedSapDataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
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
            spreadsheetId,
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
    
module.exports = router;
