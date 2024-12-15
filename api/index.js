const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const moment = require('moment-timezone'); // Import moment-timezone
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Authenticate with Google Sheets API
async function getGoogleSheetsService() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    console.log('Google Sheets credentials loaded:', credentials.client_email);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error during Google Sheets authentication:', error);
    throw error;
  }
}

// Helper function to get the current month name
function getCurrentMonthName() {
  return moment().tz('America/New_York').format('MMMM');
}

// Helper function to format the current date as MM/DD/YYYY
function getCurrentDate() {
  return moment().tz('America/New_York').format('MM/DD/YYYY');
}

function getCurrentTime() {
  return moment().tz('America/New_York').format('HH:mm:ss');
}

// Helper to format elapsed time
function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Helper to calculate elapsed time in decimal format
function calculateElapsedTimeDecimal(milliseconds) {
  return (milliseconds / (1000 * 60 * 60)).toFixed(4);
}

// Route to handle SAP Input
app.post('/api/sapInput', async (req, res) => {
  try {
    console.log('Received request for SAP Input');
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'No input provided for SAP entry.' });
    }

    const sheets = await getGoogleSheetsService();
    const now = moment().tz('America/New_York');
    const currentDate = now.format('MM/DD/YYYY');
    const currentTime = now.format('HH:mm:ss');
    const monthName = getCurrentMonthName();

    const sapSheetName = `${monthName}:SAP`;
    console.log('SAP Sheet Name:', sapSheetName);

    // Fetch the SAP sheet
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [sapSheetName],
    });

    const sheet = response.data.sheets.find(s => s.properties.title === sapSheetName);

    if (!sheet) {
      return res.status(404).json({ error: `Sheet ${sapSheetName} not found.` });
    }

    // Append the SAP input
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[currentDate, currentTime, input, '', '']],
      },
    });

    console.log('SAP Input recorded successfully');
    res.status(200).json({ message: 'SAP Input Accepted' });
  } catch (error) {
    console.error('Error in SAP Input:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

// Function to find the row for the current date in the month sheet
async function findDateRow(sheets, monthSheetName, currentDate) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${monthSheetName}!B:B`, // Assuming dates are in Column B
  });
  const rows = response.data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === currentDate) {
      return i + 1; // Google Sheets uses 1-based indexing
    }
  }
  throw new Error(`Date ${currentDate} not found in ${monthSheetName} sheet.`);
}

// Punch In Route
app.post('/api/punchIn', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsService();
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const sapSheetName = `${monthName}:SAP`;

    console.log(`Punch In - Date: ${currentDate}, Time: ${currentTime}`);

    // Find the row for the current date in the month sheet
    const monthSheetName = monthName;
    let rowIndex = await findDateRow(sheets, monthSheetName, currentDate);

    // If the row doesn't exist, add headers and a new row
    if (!rowIndex) {
      rowIndex = 3; // Assuming row 3 is where data starts after headers
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${monthSheetName}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['Date', 'Time', 'Punch In', '', 'Punch Out']] },
      });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${monthSheetName}!B:B`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[currentDate]] },
      });
    } else {
      // Check if Punch In already exists
      const punchInResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${monthSheetName}!C${rowIndex}`,
      });
      const punchInValue = punchInResponse.data.values?.[0]?.[0];
      if (punchInValue) {
        return res.status(400).json({ error: `Already punched in on ${currentDate}` });
      }
    }

    // Append Punch In time to SAP sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentDate, currentTime, 'Punch In', '', '']] },
    });

    // Update Punch In time in the month sheet (Column C)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!C${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentTime]] },
    });

    console.log('Punch In recorded successfully');
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
    const sapSheetName = `${monthName}:SAP`;

    console.log(`Punch Out - Date: ${currentDate}, Time: ${currentTime}`);

    // Find the row for the current date in the month sheet
    const monthSheetName = monthName;
    const rowIndex = await findDateRow(sheets, monthSheetName, currentDate);

    if (!rowIndex) {
      return res.status(400).json({ error: 'No Punch In found for today.' });
    }

    // Check if Punch Out already exists
    const punchOutResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!E${rowIndex}`,
    });
    const punchOutValue = punchOutResponse.data.values?.[0]?.[0];
    if (punchOutValue) {
      return res.status(400).json({ error: `Already punched out on ${currentDate}` });
    }

    // Fetch Punch In time
    const punchInResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!C${rowIndex}`,
    });
    const punchInTime = punchInResponse.data.values?.[0]?.[0];

    if (!punchInTime) {
      return res.status(400).json({ error: 'No Punch In time found for today.' });
    }

    // Calculate elapsed time
    const punchInDateTime = moment.tz(`${currentDate} ${punchInTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
    const now = moment.tz('America/New_York');
    const elapsedMilliseconds = now.diff(punchInDateTime);
    const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
    const elapsedDecimal = calculateElapsedTimeDecimal(elapsedMilliseconds);

    // Append Punch Out to SAP sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentDate, currentTime, 'Punch Out', elapsedFormatted, elapsedDecimal]] },
    });

    // Update Punch Out time in the month sheet (Column E)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${monthSheetName}!E${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentTime]] },
    });

    console.log('Punch Out recorded successfully');
    res.status(200).json({ message: 'Punch Out Accepted' });
  } catch (error) {
    console.error('Error in Punch Out:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});