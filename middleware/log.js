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
                console.log(`details: ${details}`);
            } else if (req.originalUrl === '/api/punch/out') {
                details = 'Punch Out';
                details += responseStatus === 200 ? ': Successful' : ': Failed';
                console.log(`details: ${details}`);
            } else if (req.originalUrl === '/api/sap/input') {
                const { inputText } = req.body;
                details = `Project/Activity = ${inputText}`;
                console.log(`details: ${details}`);
            } else if (req.originalUrl === '/api/edit/edit') {
                const { rowNumber, newTime, newProjectActivity } = req.body;
                console.log(`Row number: ${rowNumber}, New time: ${newTime}, New Project/Activity: ${newProjectActivity}`);
                // Fetch existing data from the SAP sheet
                const monthName = getCurrentMonthName();
                const sapSheetName = `${monthName}:SAP`;
                const range = `${sapSheetName}!A${rowNumber}:E${rowNumber}`;
                console.log(`Fetching data from range: ${range}`);
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range,
                });

                const rowData = response.data.values?.[0];
                const previousTime = rowData ? rowData[1] : 'undefined'; // Column B
                console.log(`Previous time: ${previousTime}`);
                const previousProjectActivity = rowData ? rowData[2] : 'undefined'; // Column C
                console.log(`Previous Project/Activity: ${previousProjectActivity}`);

                details = `rowNumber=${rowNumber}, Previous time=${previousTime}, Updated time=${newTime}, ` +
                    `Previous Project/Activity=${previousProjectActivity}, Updated Project/Activity=${newProjectActivity}`;
                    console.log(`details: ${details}`);
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
            console.log(`Appended log entry: ${getCurrentDate()}, ${getCurrentTime()}, ${username}, ${action}, ${details}`);
        } catch (error) {
            console.error('Error logging action:', error);
        }
    });

    next();
}

export default logAction;