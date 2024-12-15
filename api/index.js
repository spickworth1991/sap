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

// Ensure headers exist in the specified sheet
async function ensureHeaders(sheets, sheetName) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:E1`,
  });

  if (!response.data.values || response.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:E1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Date', 'Time', 'Punch In', 'Elapsed Time', 'SAP Time']],
      },
    });
  }
}

// Function to find the row for the current date in the month sheet
async function findDateRow(sheets, monthSheetName, currentDate) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${monthSheetName}!B:B`,
  });
  const rows = response.data.values || [];

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === currentDate) {
      return i + 1;
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

    await ensureHeaders(sheets, monthSheetName);
    await ensureHeaders(sheets, sapSheetName);

    let rowIndex = await findDateRow(sheets, monthSheetName, currentDate);

    if (!rowIndex) {
      rowIndex = (await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${monthSheetName}!B:B`,
      })).data.values.length + 1;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${monthSheetName}!B${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[currentDate]] },
      });
    } else {
      const punchInResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${monthSheetName}!C${rowIndex}`,
      });
      if (punchInResponse.data.values?.[0]?.[0]) {
        return res.status(400).json({ error: `Already punched in on ${currentDate}` });
      }
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!C${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentTime]] },
    });

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

    const rowIndex = await findDateRow(sheets, monthSheetName, currentDate);

    if (!rowIndex) {
      return res.status(400).json({ error: 'No Punch In found for today.' });
    }

    const punchInResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!C${rowIndex}`,
    });
    const punchInTime = punchInResponse.data.values?.[0]?.[0];

    if (!punchInTime) {
      return res.status(400).json({ error: 'No Punch In time found for today.' });
    }

    const punchInDateTime = moment.tz(`${currentDate} ${punchInTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
    const now = moment.tz('America/New_York');
    const elapsedMilliseconds = now.diff(punchInDateTime);
    const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
    const elapsedDecimal = calculateElapsedTimeDecimal(elapsedMilliseconds);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!E${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentTime]] },
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentDate, currentTime, 'Punch Out', elapsedFormatted, elapsedDecimal]] },
    });

    res.status(200).json({ message: 'Punch Out Accepted' });
  } catch (error) {
    console.error('Error in Punch Out:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

// SAP Input Route
app.post('/api/sapInput', async (req, res) => {
  try {
    console.log('Received request for SAP Input');
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'No input provided for SAP entry.' });
    }

    const sheets = await getGoogleSheetsService();
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const sapSheetName = `${monthName}:SAP`;

    await ensureHeaders(sheets, sapSheetName, currentDate);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[currentDate, currentTime, input, '', '']],
      },
    });

    res.status(200).json({ message: 'SAP Input Accepted' });
  } catch (error) {
    console.error('Error in SAP Input:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
