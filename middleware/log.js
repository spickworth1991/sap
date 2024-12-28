import { google } from 'googleapis';
import moment from 'moment-timezone';
import {
    getGoogleSheetsService,
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

    try {
        // Ensure Logs sheet exists before proceeding
        console.log(`Checking or creating Logs sheet for spreadsheetId: ${spreadsheetId}`);
        await ensureLogSheetExists(spreadsheetId);

        // Prepare log details
        const sheets = await getGoogleSheetsService();
        const username = req.body['username'] || 'Unknown User';
        const action = `${req.method} ${req.originalUrl}`;
        const details = generateDetails(req, res, role);

        // Append log entry to the Logs sheet
        console.log(`Appending log for action: ${action}`);
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Logs!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[getCurrentDate(), getCurrentTime(), username, action, details]],
            },
        });

        console.log('Log entry appended successfully.');
    } catch (error) {
        console.error('Error logging action:', error);
    }

    next(); // Proceed to the next middleware or route handler
}

async function generateDetails(req, res, role) {
    let details = '';
    const responseStatus = res.statusCode;
    const sheets = await getGoogleSheetsService();
    const { spreadsheetId } = req.body; 

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
        details = `rowNumber=${rowNumber}, Updated time=${newTime}, Updated Project/Activity=${newProjectActivity}`;
        // Fetch existing data from the SAP sheet
        const monthName = getCurrentMonthName();
        console.log(`Fetching data from month: ${monthName}`);
        const sapSheetName = `${monthName}:SAP`;
        console.log(`Fetching data from range: ${sapSheetName}!A${rowNumber}:E${rowNumber}`);
        const range = `${sapSheetName}!A${rowNumber}:E${rowNumber}`;
        console.log(`Fetching data from range: ${range}`);
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rowData = response.data.values?.[0];
        console.log(`rowData: ${rowData}`);
        const previousTime = rowData ? rowData[1] : 'undefined'; // Column B
        console.log(`previousTime: ${previousTime}`);
        const previousProjectActivity = rowData ? rowData[2] : 'undefined'; // Column C
        console.log(`previousProjectActivity: ${previousProjectActivity}`); 

        details = `rowNumber=${rowNumber}, Previous time=${previousTime}, Updated time=${newTime}, ` +
            `Previous Project/Activity=${previousProjectActivity}, Updated Project/Activity=${newProjectActivity}`;
    } else {
        details = `Unknown action: ${req.originalUrl}` + (responseStatus === 200 ? ': Successful' : ': Failed');
    }
    if (role === 'admin') {
        details += ' (Admin)';
    }

    return details;
}



export async function ensureLogSheetExists(spreadsheetId) {
    try {
        const sheets = await getGoogleSheetsService();

        // Fetch spreadsheet metadata
        console.log('Fetching spreadsheet metadata...');
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetNames = metadata.data.sheets.map(sheet => sheet.properties.title);
        console.log('Available sheet names:', sheetNames);

        // Create Logs sheet if it doesn't exist
        if (!sheetNames.includes('Logs')) {
            console.log('Logs sheet not found. Creating...');
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

            console.log('Logs sheet created.');

            // Add headers to the Logs sheet
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Logs!A1:E1',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['Date', 'Time', 'Username', 'Action', 'Details']],
                },
            });
            console.log('Headers added to Logs sheet.');
        } else {
            console.log('Logs sheet already exists.');
        }
    } catch (error) {
        console.error('Error ensuring Logs sheet exists:', error);
        throw error; // Critical error halts further operations
    }
}




export default logAction;