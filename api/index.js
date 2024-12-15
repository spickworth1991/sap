const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
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
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const now = new Date();
  return monthNames[now.getMonth()]; // Returns current month name
}

// Helper function to format the current date as MM/DD/YYYY
function getCurrentDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}/${day}/${year}`;
}

// Punch In Route
app.post('/api/punchIn', async (req, res) => {
  try {
    console.log('Received request for Punch In');

    const sheets = await getGoogleSheetsService();
    const now = new Date().toLocaleTimeString();
    const currentDate = getCurrentDate();
    const monthName = getCurrentMonthName();
    const range = `'${monthName}'!B:B`;

    console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
    console.log('Range:', range);
    console.log('Current Date:', currentDate);
    console.log('Current Time:', now);

    // Fetch all values in Column B
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    // Find the row with the current date in Column B
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === currentDate) {
        rowIndex = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: `Date ${currentDate} not found in Column B` });
    }

    const updateRange = `'${monthName}'!C${rowIndex}`;
    console.log('Update Range for Punch In:', updateRange);

    // Update Column C with the current time
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[now]],
      },
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
    console.log('Received request for Punch Out');

    const sheets = await getGoogleSheetsService();
    const now = new Date().toLocaleTimeString();
    const currentDate = getCurrentDate();
    const monthName = getCurrentMonthName();
    const range = `'${monthName}'!B:B`;

    console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
    console.log('Range:', range);
    console.log('Current Date:', currentDate);
    console.log('Current Time:', now);

    // Fetch all values in Column B
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    // Find the row with the current date in Column B
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === currentDate) {
        rowIndex = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: `Date ${currentDate} not found in Column B` });
    }

    const updateRange = `'${monthName}'!E${rowIndex}`;
    console.log('Update Range for Punch Out:', updateRange);

    // Update Column E with the current time
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[now]],
      },
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
