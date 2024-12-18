const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const moment = require('moment-timezone');
const errors = require('./errors');
const success = require('./success');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());



// Authenticate with Google Sheets API
async function getGoogleSheetsService() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Helper functions
function getCurrentMonthName() {
  return moment().tz('America/New_York').format('MMMM');
}

function getCurrentDate() {
  return moment().tz('America/New_York').format('MM/DD/YYYY');
}

function getCurrentTime() {
  return moment().tz('America/New_York').format('HH:mm:ss');
}

function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateElapsedTimeDecimal(milliseconds) {
  return (milliseconds / (1000 * 60 * 60)).toFixed(4);
}

// Ensure headers exist if the last entry in Column A is not the current date
async function ensureHeaders(sheets, sheetName, currentDate) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  });

  const rows = response.data.values || [];
  const lastEntry = rows.length > 0 ? rows[rows.length - 1][0] : null;

  if (lastEntry !== currentDate) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:E1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Date', 'Time', 'Project/Activity', 'Elapsed Time', 'SAP Time']],
      },
    });
  }
}

// Find the row for the current date in the month sheet
async function findDateRow(sheets, monthSheetName, currentDate) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${monthSheetName}!B:B`,
  });
  const rows = response.data.values || [];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === currentDate) {
      return i + 1; // Google Sheets uses 1-based indexing
    }
  }
  return null;
}

// Punch In Route
app.post('/api/punchIn', async (req, res) => {
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

    res.status(200).json(success.PUNCH_IN_SUCCESS );
  } catch (error) {
    console.error('Error in Punch In:', error);
    res.status(500).json(errors.FAIL_PUNCH_IN);
  }
});

// Punch Out Route
app.post('/api/punchOut', async (req, res) => {
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

// SAP Input Route with Calculations
app.post('/api/sapInput', async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json(errors.NO_INPUT_PROVIDED );
    }

    const sheets = await getGoogleSheetsService();
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const sapSheetName = `${monthName}:SAP`;

    await ensureHeaders(sheets, sapSheetName, currentDate);

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
    res.status(200).json({ entries: dateEntries});
    res.status(200).json(success.ENTRY_UPDATED_SUCCESS);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json(errors.FETCH_FAIL );
  }
});


// Route to edit an entry
app.post('/api/editEntry', async (req, res) => {
  try {
    const { date, rowIndex, time, projectActivity } = req.body;
    const sheets = await getGoogleSheetsService();
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



// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const authRoutes = require('./auth');
app.use('/api/auth', authRoutes);
