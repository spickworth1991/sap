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

// Punch In Route
app.post('/api/punchIn', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsService();
    const now = moment().tz('America/New_York');
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const sapSheetName = `${monthName}:SAP`;

    console.log(`Punch In - Date: ${currentDate}, Time: ${currentTime}, Sheet: ${sapSheetName}`);

    // Fetch existing sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
    });
    const rows = response.data.values || [];

    let lastRow = rows.length;
    let lastDate = lastRow > 0 ? rows[lastRow - 1][0] : null;

    // Add headers if the sheet is empty or the date has changed
    if (!lastRow || lastDate !== currentDate) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sapSheetName}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            ['Date', 'Time', 'Project/Info', 'Elapsed Time', 'SAP Time'], // Headers
            [currentDate, currentTime, 'Punch In', '', ''], // First entry
          ],
        },
      });
      console.log('Headers added and Punch In recorded.');
    } else {
      // Add Punch In to the existing row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sapSheetName}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[currentDate, currentTime, 'Punch In', '', '']],
        },
      });
      console.log('Punch In recorded.');
    }

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
    const now = moment().tz('America/New_York');
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const sapSheetName = `${monthName}:SAP`;

    console.log(`Punch Out - Date: ${currentDate}, Time: ${currentTime}, Sheet: ${sapSheetName}`);

    // Fetch existing sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
    });
    const rows = response.data.values || [];

    if (rows.length < 2) {
      throw new Error('No entries available for today.');
    }

    let lastRow = rows.length - 1;
    let lastEntry = rows[lastRow];
    let lastDate = lastEntry[0];
    let lastTime = lastEntry[1];

    if (lastDate !== currentDate) {
      throw new Error('No Punch In found for today.');
    }

    // Calculate elapsed time
    const lastDateTime = moment.tz(`${lastDate} ${lastTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
    const elapsedMilliseconds = now.diff(lastDateTime);
    const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
    const elapsedDecimal = calculateElapsedTimeDecimal(elapsedMilliseconds);

    // Append Punch Out entry
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [currentDate, currentTime, 'Punch Out', elapsedFormatted, elapsedDecimal],
        ],
      },
    });

    console.log('Punch Out recorded with elapsed time.');
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
