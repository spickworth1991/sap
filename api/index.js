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

// Punch In Route
app.post('/api/punchIn', async (req, res) => {
  try {
    console.log('Received request for Punch In');

    const sheets = await getGoogleSheetsService();
    const now = new Date().toLocaleString();
    const monthName = getCurrentMonthName();

    const range = `'${monthName}'!A1`;
    console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
    console.log('Range:', range);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Punch In', now]],
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
    const now = new Date().toLocaleString();
    const monthName = getCurrentMonthName();

    const range = `'${monthName}'!A1`;
    console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
    console.log('Range:', range);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Punch Out', now]],
      },
    });

    console.log('Punch Out recorded successfully');
    res.status(200).json({ message: 'Punch Out Accepted' });
  } catch (error) {
    console.error('Error in Punch Out:', error);
    res.status(500).json({ error: error.message || 'Unknown error occurred' });
  }
});

// SAP Input Route (if it was missing)
app.post('/api/sapInput', async (req, res) => {
  try {
    console.log('Received request for SAP Input');

    const { input } = req.body;
    const sheets = await getGoogleSheetsService();
    const now = new Date().toLocaleString();
    const monthName = getCurrentMonthName();

    const range = `'${monthName}'!B1`; // Assuming SAP input goes to column B
    console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
    console.log('Range:', range);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['SAP Input', input, now]],
      },
    });

    console.log('SAP Input recorded successfully');
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
