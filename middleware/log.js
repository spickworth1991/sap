
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
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const sheets = await getGoogleSheetsService();
        const username = req.headers['username'] || 'Unknown User';
        const action = `${req.method} ${req.originalUrl}`;

        let details;

        // Determine details based on the route
        if (req.originalUrl === '/api/punchIn') {
            details = 'Punch In';
        } else if (req.originalUrl === '/api/punchOut') {
            details = 'Punch Out';
        } else if (req.originalUrl === '/api/sapInput') {
            const { input } = req.body;
            details = `Project/Activity = ${input}`;
        } else if (req.originalUrl === '/api/editEntry') {
            const { date, rowIndex, time, projectActivity } = req.body;

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

        // Ensure the Logs sheet exists
        await ensureLogSheetExists(sheets, spreadsheetId);

        // Append log entry to the Logs sheet
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


export default logAction;
