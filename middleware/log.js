
const { google } = require('googleapis');
const moment = require('moment-timezone');
const { getGoogleSheetsService, ensureLogSheetExists } = require('../utils/googleSheetsUtils');

async function logAction(req, res, next) {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.headers['spreadsheet-id'];
        const username = req.headers['username'] || 'Unknown User';
        const action = `${req.method} ${req.originalUrl}`;

        let details;
        if (req.originalUrl.includes('/punchIn')) details = 'Punch In';
        else if (req.originalUrl.includes('/punchOut')) details = 'Punch Out';
        else details = JSON.stringify(req.body);

        await ensureLogSheetExists(sheets, spreadsheetId);

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Logs!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    moment().format('MM/DD/YYYY'),
                    moment().format('HH:mm:ss'),
                    username,
                    action,
                    details
                ]],
            },
        });
    } catch (error) {
        console.error('Error logging action:', error);
    }
    next();
}

module.exports = { logAction };
