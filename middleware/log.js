import { google } from 'googleapis';
import moment from 'moment-timezone';
import {
    getCurrentDate,
    getCurrentTime,
    getCurrentMonthName,
} from '../utils/googleSheetsUtils.js';

export async function logAction(req, res, next) {
    const { spreadsheetId, role } = req.body;

    if (!spreadsheetId) {
        console.error('Missing spreadsheetId in the request body. Logging aborted.');
        return next();
    }


    res.on('finish', async () => {
        try {
            const responseStatus = res.statusCode;
            const sheets = await getGoogleSheetsService();
            //console.log(`sheets at start: ${JSON.stringify(sheets)}`)
            const username = req.body['username'] || 'Unknown User';
            const action = `${req.method} ${req.originalUrl}`;
            console.log(`spreadsheetId: ${spreadsheetId}`);


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

                    details = `rowNumber=${rowNumber}, Previous time=${previousTime}, Updated time=${newTime}, ` +
                    `Previous Project/Activity=${previousProjectActivity}, Updated Project/Activity=${newProjectActivity}`;
                    

            } else {
                    details = `Unknown action: ${req.originalUrl}` + (responseStatus === 200 ? ': Successful' : ': Failed'), JSON.stringify(req.body);
                    console.log(details)       
            }

            if (role === 'admin') {
                details += ` (Admin)`;
                console.log(details)

                // Ensure the Logs sheet exists
            await ensureLogSheetExists(spreadsheetId);

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
async function ensureLogSheetExists(spreadsheetId) {
    try {
        const sheets = await getGoogleSheetsService();
        console.log('Ensuring Logs sheet exists...');
        console.log(`spreadsheetId: ${spreadsheetId}`); 
        console.log(`sheets: ${JSON.stringify(sheets)}`);

        // Check if the sheets object has the expected structure
        console.log(`sheets.spreadsheets: ${JSON.stringify(sheets.spreadsheets)}`);
        if (!sheets.spreadsheets || typeof sheets.spreadsheets.get !== 'function') {
            console.error('Invalid sheets object structure:', sheets);
        }

        // Get the sheet metadata
        const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId });
            console.error(`sheetMetadata: ${JSON.stringify(sheetMetadata.data)}`);

        // Check if the sheets property exists and is an array
        if (!sheetMetadata.data.sheets || !Array.isArray(sheetMetadata.data.sheets)) {
            console.error('Invalid sheetMetadata structure:', sheetMetadata.data);
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
        // Log the error and continue without throwing
    }
}


// Authenticate with Google Sheets API
async function getGoogleSheetsService() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

export default logAction;