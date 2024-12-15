const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

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
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
  });

  const rows = response.data.values || [];
  const lastEntry = rows.length > 0 ? rows[rows.length - 1][0] : null;

  if (lastEntry !== currentDate) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
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
    spreadsheetId: SPREADSHEET_ID,
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
      return res.status(400).json({ error: `No entry found for ${currentDate} in the month sheet.` });
    }

    // Check if Punch In time already exists in Column C
    const punchInResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!C${rowIndex}`,
    });
    if (punchInResponse.data.values?.[0]?.[0]) {
      return res.status(400).json({ error: `Already punched in on ${currentDate}` });
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

    res.status(200).json({ message: 'Punch In Accepted' });
  } catch (error) {
    console.error('Error in Punch In:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
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
      return res.status(400).json({ error: `No entry found for ${currentDate} in the month sheet.` });
    }

    // Check if Punch Out time already exists in Column E
    const punchOutResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!E${rowIndex}`,
    });
    if (punchOutResponse.data.values?.[0]?.[0]) {
      return res.status(400).json({ error: `Already punched out on ${currentDate}` });
    }

    // Check if Punch In time exists in Column C
    const punchInResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!C${rowIndex}`,
    });
    const punchInTime = punchInResponse.data.values?.[0]?.[0];

    if (!punchInTime) {
      return res.status(400).json({ error: 'No Punch In time found for today.' });
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

    res.status(200).json({ message: 'Punch Out Accepted with Totals' });
  } catch (error) {
    console.error('Error in Punch Out:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});



// SAP Input Route with Calculations
app.post('/api/sapInput', async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ error: errors.NO_INPUT_PROVIDED });
    }

    const sheets = await getGoogleSheetsService();
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const sapSheetName = `${monthName}:SAP`;

    await ensureHeaders(sheets, sapSheetName, currentDate);

    // Fetch the last row to calculate elapsed time
    const lastRow = (await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!B:B`,
    })).data.values.length;

    const previousTimeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
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
        spreadsheetId: SPREADSHEET_ID,
        range: `${sapSheetName}!D${lastRow}:E${lastRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
      });
    }

    // Append the new SAP input
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentDate, currentTime, input, '', '']] },
    });

    res.status(200).json({ message: 'SAP Input Accepted' });
  } catch (error) {
    console.error('Error in SAP Input:', error);
    res.status(500).json({ error: error.message || errors.UNKNOWN_ERROR });
  }
});

// Route to get entries for a specific date
app.get('/api/entries/:date', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsService();
    const selectedDate = req.params.date; // Date in MM/DD/YYYY format
    const monthName = moment(selectedDate, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
    const sapSheetName = `${monthName}:SAP`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
    });

    const allEntries = response.data.values || [];
    const dateEntries = allEntries.filter(row => row[0] === selectedDate);

    res.status(200).json({ entries: dateEntries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

// Route to edit an entry
app.post('/api/editEntry', async (req, res) => {
  try {
    const { date, rowIndex, time, projectActivity } = req.body;
    const sheets = await getGoogleSheetsService();
    const monthName = moment(date, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
    const sapSheetName = `${monthName}:SAP`;

    // Update the specified row with new data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!B${rowIndex}:C${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[time, projectActivity]] },
    });

    // Fetch the previous row to recalculate elapsed time and SAP time
    const previousRowIndex = rowIndex - 1;
    const previousTimeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!B${previousRowIndex}`,
    });
    const previousTime = previousTimeResponse.data.values?.[0]?.[0];

    if (previousTime) {
      const previousDateTime = moment.tz(`${date} ${previousTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
      const newDateTime = moment.tz(`${date} ${time}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
      const elapsedMilliseconds = newDateTime.diff(previousDateTime);
      const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
      const elapsedDecimal = calculateElapsedTimeDecimal(elapsedMilliseconds);

      // Update the previous row's elapsed time and SAP time
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sapSheetName}!D${previousRowIndex}:E${previousRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
      });
    }

    res.status(200).json({ message: 'Entry updated successfully' });
  } catch (error) {
    console.error('Error in editing entry:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
