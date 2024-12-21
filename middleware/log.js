
const { google } = require('googleapis');
const moment = require('moment-timezone');
const { getGoogleSheetsService, ensureLogSheetExists } = require('../utils/googleSheetsUtils');

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

module.exports = { logAction };
