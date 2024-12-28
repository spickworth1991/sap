import { google } from 'googleapis';
import moment from 'moment-timezone';


// Validate JSON format
function isValidJSON(jsonString) {
  try {
      JSON.parse(jsonString);
      return true;
  } catch (error) {
      return false;
  }
}

// Authenticate with Google Sheets API
export async function getGoogleSheetsService() {
  try {
      const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (!isValidJSON(credentialsString)) {
          throw new Error('Invalid JSON format for GOOGLE_SERVICE_ACCOUNT_KEY');
      }
      const credentials = JSON.parse(credentialsString);
      const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return google.sheets({ version: 'v4', auth });
  } catch (error) {
      console.error('Error parsing GOOGLE_SERVICE_ACCOUNT_KEY:', error);
      throw error;
  }
}

// Date and Time Utilities
export function getCurrentMonthName() {
    return moment().tz('America/New_York').format('MMMM');
}

export function getCurrentDate() {
    return moment().tz('America/New_York').format('MM/DD/YYYY');
}

export function getCurrentTime() {
    return moment().tz('America/New_York').format('HH:mm:ss');
}

// Helper function to ensure the Logs sheet exists
export async function ensureLogSheetExists(sheets, spreadsheetId) {
    try {
      // Get the sheet metadata
      const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetNames = sheetMetadata.data.sheets.map(sheet => sheet.properties.title);
  
      // Check if "Logs" sheet exists
      if (!sheetNames.includes('Logs')) {
        console.log('Creating Logs sheet...');
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
      console.log('Error ensuring Logs sheet exists:', error);
      return res.status(502).json({ error: 'Failed to ensure Logs sheet exists' }); 
    }
}

export async function findDateRow(sheets, monthName, currentDate, spreadsheetId ) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${monthName}!B:B`,
    });
  
    const rows = response.data.values || [];
    //console.log(`rows: ${rows}`);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === currentDate) {
      return i + 1; // Google Sheets uses 1-based indexing
      }
    }
    return null;
}


export function formatElapsedTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
export function calculateElapsedTimeDecimal(milliseconds) {
    return (milliseconds / (1000 * 60 * 60)).toFixed(4);
}
  
  // Ensure headers exist if the last entry in Column A is not the current date
export async function ensureHeaders(sheets, sapSheetName, currentDate, spreadsheetId ) {
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

export async function editEntry(req, res, next) {
  try {
      const sheets = await getGoogleSheetsService();
      const { date, rowIndex, newTime, newProjectActivity } = req.body;
      const spreadsheetId = req.headers['spreadsheet-id'];

      if (!spreadsheetId) {
          return res.status(400).json({ error: 'Spreadsheet ID is required' });
      }

      const monthName = moment(date, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
      const sapSheetName = `${monthName}:SAP`;

      // Update the specified row with new values
      await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sapSheetName}!B${rowIndex}:C${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[newTime, newProjectActivity]] },
      });

      next(); // Pass control to the next middleware or route handler
  } catch (error) {
      console.error('Error in editEntry middleware:', error);
      res.status(500).json({ error: 'Failed to edit entry' });
  }
}

export async function fetchLogs(req, res, next) {
  try {
      const sheets = await getGoogleSheetsService();
      const spreadsheetId = req.headers['spreadsheet-id'];

      if (!spreadsheetId) {
          return res.status(400).json({ error: 'Spreadsheet ID is required' });
      }

      const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Logs!A:E', // Assuming logs are stored in columns A to E
      });

      req.logs = response.data.values || [];
      next(); // Pass control to the next middleware
  } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
  }
}


// Function to update status and hide it after a certain duration
export async function updateStatus(message, type) {
  const statusBox = document.getElementById("statusBox");

  if (statusBox) {
      // Reset status classes
      statusBox.classList.remove("success", "error");
      statusBox.classList.add(type);

      // Handle message types
      if (typeof message === 'object' && message.code && message.message) {
          statusBox.innerText = `${type === 'error' ? 'Error' : 'Success'} ${message.code}: ${message.message}`;
      } else if (typeof message === 'string') {
          statusBox.innerText = message;
      } else {
          statusBox.innerText = type === 'error' ? 'An unknown error occurred.' : 'Operation successful.';
      }

      // Show status box
      statusBox.classList.add("show");

      // Hide status box after duration
      setTimeout(() => {
          statusBox.classList.remove("show");
      }, type === "success" ? 3000 : 5000);
  } else {
      console.error('Status box not found.');
  }
}


