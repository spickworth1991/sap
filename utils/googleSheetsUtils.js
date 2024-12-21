
const { google } = require('googleapis');
const moment = require('moment-timezone');

// Authenticate with Google Sheets API
async function getGoogleSheetsService() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

// Date and Time Utilities
function getCurrentMonthName() {
    return moment().tz('America/New_York').format('MMMM');
}

function getCurrentDate() {
    return moment().tz('America/New_York').format('MM/DD/YYYY');
}

function getCurrentTime() {
    return moment().tz('America/New_York').format('HH:mm:ss');
}

// Helper function to ensure the Logs sheet exists
async function ensureLogSheetExists(sheets, spreadsheetId) {
    try {
      // Get the sheet metadata
      const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetNames = sheetMetadata.data.sheets.map(sheet => sheet.properties.title);
  
      // Check if "Logs" sheet exists
      if (!sheetNames.includes('Logs')) {
        // Create a new Logs sheet with headers
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Logs',
                    gridProperties: { rowCount: 1000, columnCount: 5 },
                  },
                },
              },
            ],
          },
        });
  
        // Add headers to the Logs sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Logs!A1:E1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [['Date', 'Time', 'Username', 'Action', 'Details']],
          },
        });
      }
    } catch (error) {
      console.error('Error ensuring Logs sheet exists:', error);
    }
}

async function findDateRow(sheets, spreadsheetId, monthSheetName, currentDate) {
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
async function ensureHeaders(sheets, sapSheetName, currentDate, spreadsheetId ) {
const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sapSheetName}!A:A`,
});

const rows = response.data.values || [];
const lastEntry = rows.length > 0 ? rows[rows.length - 1][0] : null;

if (lastEntry !== currentDate) {
    await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sapSheetName}!A1:E1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
        values: [['Date', 'Time', 'Project/Activity', 'Elapsed Time', 'SAP Time']],
    },
    });
}
}
  

// Exported Functions
module.exports = {
    getGoogleSheetsService,
    getCurrentMonthName,
    getCurrentDate,
    getCurrentTime,
    ensureLogSheetExists,
    findDateRow,
    formatElapsedTime,
    calculateElapsedTimeDecimal,
    ensureHeaders,

};
