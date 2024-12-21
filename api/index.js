const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const moment = require('moment-timezone');
const errors = require('./errors');
const success = require('./success');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());



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
async function ensureHeaders(sheets, sheetName, currentDate, spreadsheetId ) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  });

  const rows = response.data.values || [];
  const lastEntry = rows.length > 0 ? rows[rows.length - 1][0] : null;

  if (lastEntry !== currentDate) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1:E1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Date', 'Time', 'Project/Activity', 'Elapsed Time', 'SAP Time']],
      },
    });
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


app.post('/api/punchIn', logAction, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsService();
    const spreadsheetId = req.headers['spreadsheet-id'];

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
    }

    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const monthSheetName = monthName;
    const sapSheetName = `${monthName}:SAP`;

    // Ensure headers are present in the SAP sheet
    await ensureHeaders(sheets, sapSheetName, currentDate, spreadsheetId);

    // Find the row with the current date on the month sheet
    let rowIndex = await findDateRow(sheets, spreadsheetId, monthSheetName, currentDate);

    if (!rowIndex) {
      return res.status(400).json(errors.NO_ENTRY_FOUND);
    }

    // Check if Punch In time already exists in Column C
    const punchInResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${monthSheetName}!C${rowIndex}`,
    });
    if (punchInResponse.data.values?.[0]?.[0]) {
      return res.status(400).json(errors.PUNCH_IN_EXISTS);
    }

    // Update the Punch In time in Column C on the month sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${monthSheetName}!C${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentTime]] },
    });

    // Add Punch In entry to the SAP sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentDate, currentTime, 'Punch In', '', '']] },
    });

    res.status(200).json(success.PUNCH_IN_SUCCESS);
  } catch (error) {
    console.error('Error in Punch In:', error);
    res.status(500).json(errors.FAIL_PUNCH_IN);
  }
});



// Punch Out Route
app.post('/api/punchOut', logAction, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsService();
	const spreadsheetId = req.headers['spreadsheet-id']; // Extract spreadsheetId from request headers

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
    }

    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const monthSheetName = monthName;
    const sapSheetName = `${monthName}:SAP`;

    // Find the row with the current date on the month sheet
    let rowIndex = await findDateRow(sheets, spreadsheetId, monthSheetName, currentDate);

    if (!rowIndex) {
      return res.status(400).json(errors.NO_ENTRY_FOUND);
    }

    // Check if Punch Out time already exists in Column E
    const punchOutResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${monthSheetName}!E${rowIndex}`,
    });
    if (punchOutResponse.data.values?.[0]?.[0]) {
      return res.status(400).json(errors.PUNCH_OUT_EXISTS);
    }

    // Check if Punch In time exists in Column C
    const punchInResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${monthSheetName}!C${rowIndex}`,
    });
    const punchInTime = punchInResponse.data.values?.[0]?.[0];

    if (!punchInTime) {
      return res.status(400).json(errors.NO_PUNCH_IN_FOUND);
    }

    // Update the Punch Out time in Column E on the month sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${monthSheetName}!E${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentTime]] },
    });

    // Fetch the last row number on the SAP sheet
    const sapDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sapSheetName}!B:B`,
    });
    const lastRow = sapDataResponse.data.values ? sapDataResponse.data.values.length : 1;

    // Get the previous row's time
    const previousTimeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
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
        spreadsheetId,
        range: `${sapSheetName}!D${lastRow}:E${lastRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
      });
    }

    // Add Punch Out entry to the SAP sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentDate, currentTime, 'Punch Out', '', '']] },
    });

    // Calculate totals for the current date
    const updatedSapDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
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
      spreadsheetId,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['', '', 'Totals', totalElapsedFormatted, totalSapTimeFormatted]] },
    });

    res.status(200).json(success.PUNCH_OUT_SUCCESS);
  } catch (error) {
    console.error('Error in Punch Out:', error);
    res.status(500).json(errors.FAIL_PUNCH_OUT );
  }
});

// SAP Input Route with Calculations
app.post('/api/sapInput', logAction, async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json(errors.NO_INPUT_PROVIDED );
    }

    const sheets = await getGoogleSheetsService();
	const spreadsheetId = req.headers['spreadsheet-id']; // Extract spreadsheetId from request headers

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
    }
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const monthName = getCurrentMonthName();
    const sapSheetName = `${monthName}:SAP`;
	

    // Fetch the last row to calculate elapsed time
    const lastRow = (await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sapSheetName}!B:B`,
    })).data.values.length;

    const previousTimeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
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
        spreadsheetId,
        range: `${sapSheetName}!D${lastRow}:E${lastRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
      });
    }

    // Append the new SAP input
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sapSheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[currentDate, currentTime, input, '', '']] },
    });

    res.status(200).json(success.SAP_INPUT_SUCCESS);
  } catch (error) {
    console.error('Error in SAP Input:', error);
    res.status(500).json(errors.SAP_FAIL);
  }
});

app.get('/api/entries/:date', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsService();
    const spreadsheetId = req.headers['spreadsheet-id']; // Extract spreadsheetId from request headers

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
    }

    const selectedDate = req.params.date; // Date in MM/DD/YYYY format
    const monthName = moment(selectedDate, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
    const sapSheetName = `${monthName}:SAP`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sapSheetName}!A:E`,
    });

    const allEntries = response.data.values || [];
    const dateEntries = allEntries
      .map((row, index) => ({ rowNumber: index + 1, values: row }))
      .filter(row => row.values[0] === selectedDate);

    // Only one response should be sent
    res.status(200).json({ entries: dateEntries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json(errors.FETCH_FAIL);
  }
});



// Route to edit an entry
app.post('/api/editEntry', logAction, async (req, res) => {
  try {
    const { date, rowIndex, time, projectActivity } = req.body;
    const sheets = await getGoogleSheetsService();
	const spreadsheetId = req.headers['spreadsheet-id']; // Extract spreadsheetId from request headers

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
    }
    const monthName = moment(date, 'MM/DD/YYYY').tz('America/New_York').format('MMMM');
    const sapSheetName = `${monthName}:SAP`;

    // 1. Update the specified row with the new time and project/activity
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sapSheetName}!B${rowIndex}:C${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[time, projectActivity]] },
    });

    // 2. Fetch the updated sheet data to recalculate elapsed times and SAP times
    let sapDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sapSheetName}!A:E`,
    });

    let sapData = sapDataResponse.data.values || [];

    // Find all rows with the same date
    let dateRows = sapData
      .map((row, index) => ({ index: index + 1, row }))
      .filter(item => item.row[0] === date);

    // Recalculate elapsed times and SAP times for each row and update the previous row
    for (let i = 1; i < dateRows.length; i++) {
      const currentRow = dateRows[i];
      const previousRow = dateRows[i - 1];

      const previousTime = previousRow.row[1];
      const currentTime = currentRow.row[1];

      if (previousTime && currentTime) {
        const previousDateTime = moment.tz(`${date} ${previousTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
        const currentDateTime = moment.tz(`${date} ${currentTime}`, 'MM/DD/YYYY HH:mm:ss', 'America/New_York');
        const elapsedMilliseconds = currentDateTime.diff(previousDateTime);
        const elapsedFormatted = formatElapsedTime(elapsedMilliseconds);
        const elapsedDecimal = calculateElapsedTimeDecimal(elapsedMilliseconds);

        // Update the previous row's elapsed time and SAP time
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sapSheetName}!D${previousRow.index}:E${previousRow.index}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[elapsedFormatted, elapsedDecimal]] },
        });
      }
    }

    // 3. Fetch the updated sheet data again after recalculations
    let updatedSapDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sapSheetName}!A:E`,
    });

    let updatedSapData = updatedSapDataResponse.data.values || [];

    // Create fresh dateRows with the updated data
    dateRows = updatedSapData
      .map((row, index) => ({ index: index + 1, row }))
      .filter(item => item.row[0] === date);

    // 4. Recalculate totals for the current date
    let lastRowWithDate = dateRows[dateRows.length - 1].index;
    let totalsRowIndex = null;

    // Find the "Totals" row after the last row with the current date
    for (let i = lastRowWithDate + 1; i <= updatedSapData.length; i++) {
      const row = updatedSapData[i - 1];
      if (row && row[2] === 'Totals') {
        totalsRowIndex = i;
        break;
      }
    }

    // If a totals row is found, recalculate and update the totals
    if (totalsRowIndex) {
      let totalElapsedTime = 0;
      let totalSapTime = 0;

      dateRows.forEach(row => {
        const elapsedTime = row.row[3];
        const sapTime = row.row[4];

        if (elapsedTime && sapTime) {
          const [hours, minutes, seconds] = elapsedTime.split(':').map(Number);
          totalElapsedTime += hours * 3600 + minutes * 60 + seconds;
          totalSapTime += parseFloat(sapTime);
        }
      });

      const totalElapsedFormatted = formatElapsedTime(totalElapsedTime * 1000);
      const totalSapTimeFormatted = totalSapTime.toFixed(4);

      // Update the totals row with recalculated totals
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sapSheetName}!D${totalsRowIndex}:E${totalsRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[totalElapsedFormatted, totalSapTimeFormatted]] },
      });
    }

    res.status(200).json(success.ENTRY_UPDATED_SUCCESS);
  } catch (error) {
    console.error('Error in editing entry:', error);
    res.status(500).json(errors.UPDATE_FAILED);
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsService();
    const spreadsheetId = req.headers['spreadsheet-id']; // Get the spreadsheet ID from headers
    const { date, search } = req.query;

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
    }

    // Fetch logs from a sheet named "Logs"
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Logs!A:E', // Assuming logs are stored in columns A to E
    });

    let logs = response.data.values || [];

    // Convert logs to objects with headers: Date, Time, Username, Action, Details
    const headers = logs.shift();
    logs = logs.map(row => ({
      date: row[0],
      time: row[1],
      username: row[2],
      action: row[3],
      details: row[4],
    }));

    // Filter by date if provided
    if (date) {
      logs = logs.filter(log => log.date === date);
    }

    // Filter by search term if provided
    if (search) {
      const lowerSearch = search.toLowerCase();
      logs = logs.filter(log =>
        Object.values(log).some(value => value.toLowerCase().includes(lowerSearch))
      );
    }

    res.status(200).json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});


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

async function logAction(req, res, next) {
  try {
    const sheets = await getGoogleSheetsService();
    const spreadsheetId = req.headers['spreadsheet-id'];
    const username = req.headers['username'] || 'Unknown User';
    const action = req.method + ' ' + req.originalUrl;

    let details;

    // Format details based on the route
    if (req.originalUrl === '/api/punchIn') {
      details = 'Punch In';
    } else if (req.originalUrl === '/api/punchOut') {
      details = 'Punch Out';
    } else if (req.originalUrl === '/api/sapInput') {
      const { input } = req.body;
      details = `Project/Activity = ${input}`;
    } else if (req.originalUrl === '/api/editEntry') {
      const { date, rowIndex, time, projectActivity } = req.body;

      // Fetch the current data from the row being edited
      const monthName = getCurrentMonthName();
      const sapSheetName = `${monthName}:SAP`;
      const range = `${sapSheetName}!A${rowIndex}:E${rowIndex}`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rowData = response.data.values?.[0]; // Fetch the row data
      const previousTime = rowData ? rowData[1] : 'undefined'; // Column B
      const previousProjectActivity = rowData ? rowData[2] : 'undefined'; // Column C

      details = `rowIndex=${rowIndex}, Previous time = ${previousTime}, Updated time = ${time}, ` +
                `Previous Project/Activity = ${previousProjectActivity}, Updated Project/Activity = ${projectActivity}`;
    } else {
      details = JSON.stringify(req.body);
    }

    // Ensure the Logs sheet exists
    await ensureLogSheetExists(sheets, spreadsheetId);

    // Log the action
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Logs!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[getCurrentDate(), getCurrentTime(), username, action, details]],
      },
    });
  } catch (error) {
    console.error('Error logging action:', error);
  }

  next();
}






// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const authRoutes = require('./auth');
app.use('/api/auth', authRoutes);
