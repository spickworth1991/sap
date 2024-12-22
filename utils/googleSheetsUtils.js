
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

async function editEntry(req, res, next) {
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

async function fetchLogs(req, res, next) {
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

async function sapInput(req, res, next) {
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




function decodeToken(token) {
  try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = atob(payloadBase64);
      return JSON.parse(decodedPayload);
  } catch (error) {
      console.error('Error decoding token:', error);
      return null;
  }
}

function setUserDetails(authToken) {
  const userData = decodeToken(authToken);
  if (userData) {
      localStorage.setItem('role', userData.role);
      localStorage.setItem('spreadsheetId', userData.spreadsheetId);
  } else {
      console.error('Failed to decode user details from token.');
  }
}

function showInitialPage() {
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
      setUserDetails(authToken);
  }

  const role = localStorage.getItem('role');
  console.log(`userRole: ${role}`);

  // Check the current page URL
  const currentPage = window.location.pathname;
  const adminHomeBtn = document.getElementById('admin-home-btn');

  if (role) {
      // Redirect to homePage.html if not already there
      if (currentPage !== '/homePage.html') {
          window.location.href = 'homePage.html';
      } else if (role === 'admin' && adminHomeBtn) {
          adminHomeBtn.style.display = 'inline-block';
      }
  } else {
      // Redirect to index.html for non-admin users
      if (currentPage !== '/index.html' && currentPage !== '/') {
          window.location.href = 'index.html';
      }
  }
}

// Navigation function to show the selected page
function navigateTo(pageId) {
  const pageMap = {
      homePage: 'homePage.html',
      manageUsersPage: 'manage_users.html',
      viewLogsPage: 'view_logs.html',
      editEntriesPage: 'edit_entries.html',
      clockPage: 'clockPage.html',
      sapPage: 'sapPage.html',
      dateSelectionPage: 'dateSelect.html',
      adminPage: 'admin.html',
  };

  const pageUrl = pageMap[pageId];
  if (pageUrl) {
      window.location.href = pageUrl;
  } else {
      console.log(`Page not found: ${pageId}`);
  }
}

// Function to update status and hide it after a certain duration
function updateStatus(message, type) {
  const statusBox = document.getElementById("statusBox");

  if (statusBox) {
      statusBox.classList.remove("success", "error");
      statusBox.classList.add(type);

      if (typeof message === 'object' && message.code && message.message) {
          statusBox.innerText = `${type === 'error' ? 'Error' : 'Success'} ${message.code}: ${message.message}`;
      } else if (typeof message === 'string') {
          statusBox.innerText = message;
      } else {
          statusBox.innerText = type === 'error' ? 'An unknown error occurred.' : 'Operation successful.';
      }

      statusBox.classList.add("show");

      setTimeout(() => {
          statusBox.classList.remove("show");
      }, type === "success" ? 3000 : 5000);
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
    editEntry,
    sapInput,
    fetchLogs,
    updateStatus,
    navigateTo,
    decodeToken,
    setUserDetails,
    showInitialPage

};
