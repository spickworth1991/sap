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
    const { spreadsheetId, role } = req.body;
    if (!spreadsheetId ) {
        console.error('Missing spreadsheetId in the request body. Logging aborted.');
        return;
    }
    
    res.on('finish', async () => {
        try {
            const responseStatus = res.statusCode;
            const sheets = await getGoogleSheetsService();
            const username = req.body['username'] || 'Unknown User';
            const action = `${req.method} ${req.originalUrl}`;
            console.log(spreadsheetId)

            let details;

            // Determine details based on the route
            switch (req.originalUrl) {
                case '/api/punch/in':
                    details = 'Punch In' + (responseStatus === 200 ? ': Successful' : ': Failed');
                    break;
                case '/api/punch/out':
                    details = 'Punch Out' + (responseStatus === 200 ? ': Successful' : ': Failed');
                    break; 
                case '/api/sap/input': 
                    const { inputText } = req.body;
                    details = `Project/Activity = ${inputText}` + (responseStatus === 200 ? ': Successful' : ': Failed');
                    break;
                case '/api/edit/edit':
                    const { rowNumber, newTime, newProjectActivity } = req.body;

                    // Fetch existing data from the SAP sheet
                    const monthName = getCurrentMonthName();
                    const sapSheetName = `${monthName}:SAP`;
                    const range = `${sapSheetName}!A${rowNumber}:E${rowNumber}`;
                    const response = await sheets.spreadsheets.values.get({
                        spreadsheetId,
                        range,
                    });

                    const rowData = response.data.values?.[0];
                    const previousTime = rowData ? rowData[1] : 'undefined'; // Column B
                    const previousProjectActivity = rowData ? rowData[2] : 'undefined'; // Column C

                    details = `rowNumber=${rowNumber}, Previous time=${previousTime}, Updated time=${newTime}, Previous Project/Activity=${previousProjectActivity}, Updated Project/Activity=${newProjectActivity}`;
                    break;

                    default:   
                        details = `Unknown action: ${req.originalUrl}` + (responseStatus === 200 ? ': Successful' : ': Failed'), JSON.stringify(req.body) ;
                        break;}
            if (role === 'admin') {
                details += ` (Admin)`;
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
    });

    next();
}

export default logAction;