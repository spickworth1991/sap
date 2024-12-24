import { google } from 'googleapis';
import moment from 'moment-timezone';


// Authenticate with Google Sheets API
export async function getGoogleSheetsService() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

// Log a punch action
export async function logPunchAction(spreadsheetId, logEntry) {
  const sheets = await getGoogleSheetsService();
  const { userId, date, time, action } = logEntry;

  const row = [userId, action, date, time];

  try {
      await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Logs!A:D',
          valueInputOption: 'RAW',
          requestBody: { values: [row] },
      });
      console.log(`Logged punch action: ${action} for user ${userId}`);
  } catch (error) {
      console.error('Error logging punch action:', error);
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

export async function findDateRow(sheets, monthSheetName, currentDate, spreadsheetId) {
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
      const { date, rowIndex, time, projectActivity } = req.body;
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
          requestBody: { values: [[time, projectActivity]] },
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

export async function sapInput(req, res, next) {
  try {
      const sheets = await getGoogleSheetsService();
      const { input } = req.body;
      const spreadsheetId = req.headers['spreadsheet-id'];

      if (!spreadsheetId || !input) {
          return res.status(400).json({ error: 'Spreadsheet ID and input are required' });
      }

      const currentDate = getCurrentDate();
      const currentTime = getCurrentTime();
      const monthName = getCurrentMonthName();
      const sapSheetName = `${monthName}:SAP`;

      // Append the new SAP input
      await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sapSheetName}!A:E`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[currentDate, currentTime, input, '', '']] },
      });

      next(); // Pass control to the next middleware
  } catch (error) {
      console.error('Error in SAP input middleware:', error);
      res.status(500).json({ error: 'Failed to process SAP input' });
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


export async function fetchSpreadsheetId() {
      // Updated login.js with enhanced logging
    const apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/auth'
    : '/api/auth'; // For production deployment on Vercel
    try {
        const response = await fetch(`${apiBaseUrl}/user-details`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('spreadsheetId', data.user.spreadsheetId);
            console.log(`spreadsheetId At fetchSpreadsheetId: ${data.user.spreadsheetId}`);
        } else {
            console.error('Failed to fetch user details');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
    }
}

