import { google } from 'googleapis';
import moment from 'moment-timezone';
import {
    getGoogleSheetsService,
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
            //console.log(`sheets at start: ${JSON.stringify(sheets)}`)
            const username = req.body['username'] || 'Unknown User';
            const action = `${req.method} ${req.originalUrl}`;
            console.log(`spreadsheetId: ${spreadsheetId}`);
            // Ensure the Logs sheet exists
            await ensureLogSheetExists(spreadsheetId);
            console.log('Logs sheet exists');

            let details;

            // Determine details based on the route
            switch (req.originalUrl) {
                case '/api/punch/in':
                    details = 'Punch In' + (responseStatus === 200 ? ': Successful' : ': Failed');
                    console.log(details)
                    break;
                case '/api/punch/out':
                    details = 'Punch Out' + (responseStatus === 200 ? ': Successful' : ': Failed');
                    console.log(details)
                    break;
                case '/api/sap/input':
                    const { inputText } = req.body;
                    details = `Project/Activity = ${inputText}` + (responseStatus === 200 ? ': Successful' : ': Failed');
                    console.log(details)
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
                    console.log(details)
                    break;

                default:
                    details = `Unknown action: ${req.originalUrl}` + (responseStatus === 200 ? ': Successful' : ': Failed'), JSON.stringify(req.body);
                    console.log(details)
                    break;
            }
            if (role === 'admin') {
                details += ` (Admin)`;
                console.log(details)
            }
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


// Helper function to ensure the Logs sheet exists
export async function ensureLogSheetExists(spreadsheetId) {
    const sheets = await getGoogleSheetsService();
    console.log('Ensuring Logs sheet exists...');
    console.log(`spreadsheetId: ${spreadsheetId}`); 
    console.log(`sheets: ${JSON.stringify(sheets)}`);
    try {
        // Check if the sheets object has the expected structure
        if (!sheets.spreadsheets || typeof sheets.spreadsheets.get !== 'function') {
            console.error('Invalid sheets object structure:', sheets);
            throw new Error('Invalid sheets object structure');
        }

        // Get the sheet metadata
        const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
        console.log(`sheetMetadata: ${JSON.stringify(sheetMetadata.data)}`);

        // Check if the sheets property exists and is an array
        if (!sheetMetadata.data.sheets || !Array.isArray(sheetMetadata.data.sheets)) {
            throw new Error('Invalid sheet metadata format');
        }

        const sheetNames = sheetMetadata.data.sheets.map(sheet => sheet.properties.title);
        console.log(`sheetNames: ${sheetNames}`);

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
        console.error('Error ensuring Logs sheet exists:', error);
        throw error; // Re-throw the error to be handled by the calling function
    }
    console.log('Logs sheet exists (or was created)');
}



export default logAction;