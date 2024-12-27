import { google } from 'googleapis';
import moment from 'moment-timezone';
import {
    getGoogleSheetsService,
    ensureLogSheetExists,
    getCurrentDate,
    getCurrentTime,
    getCurrentMonthName,
} from '../utils/googleSheetsUtils.js';

export async function logAction(req, res, next) {
    const originalSend = res.send;
    let responseStatus;

    res.send = function (body) {
        responseStatus = res.statusCode;
        originalSend.call(this, body);
    };

    res.on('finish', async () => {
        try {
            const { spreadsheetId, role } = req.body;
            const sheets = await getGoogleSheetsService();
            const username = req.body['username'] || 'Unknown User';
            const action = `${req.method} ${req.originalUrl}`;

            let details;

            // Determine details based on the route
            if (req.originalUrl === '/api/punch/in') {
                details = 'Punch In';
                details += responseStatus === 200 ? ': Successful' : ': Failed';
            } else if (req.originalUrl === '/api/punch/out') {
                details = 'Punch Out';
                details += responseStatus === 200 ? ': Successful' : ': Failed';
            } else if (req.originalUrl === '/api/sap/input') {
                const { inputText } = req.body;
                details = `Project/Activity = ${inputText}`;
            } else if (req.originalUrl === '/api/edit/edit') {
                const { rowIndex, time, projectActivity } = req.body;

                // Fetch existing data from the SAP sheet
                const monthName = getCurrentMonthName();
                const sapSheetName = `${monthName}:SAP`;
                const range = `${sapSheetName}!A${rowIndex}:E${rowIndex}`;
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range,
                });

                const rowData = response.data.values?.[0];
                const previousTime = rowData ? rowData[1] : 'undefined'; // Column B
                const previousProjectActivity = rowData ? rowData[2] : 'undefined'; // Column C

                details = `rowIndex=${rowIndex}, Previous time=${previousTime}, Updated time=${time}, ` +
                    `Previous Project/Activity=${previousProjectActivity}, Updated Project/Activity=${projectActivity}`;
            } else {
                details = JSON.stringify(req.body);
            }

            // Log the action to Google Sheets
            await ensureLogSheetExists(sheets, spreadsheetId);
            const currentDate = getCurrentDate();
            const currentTime = getCurrentTime();
            const logData = [[currentDate, currentTime, username, role, action, details]];
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Log!A1',
                valueInputOption: 'USER_ENTERED',
                resource: { values: logData },
            });
        } catch (error) {
            console.error('Error logging action:', error);
        }
    });

    next();
}