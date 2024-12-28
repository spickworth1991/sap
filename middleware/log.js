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


    res.on('finish', async () => {
        try {
            // Ensure Logs sheet exists
            await ensureLogSheetExists(spreadsheetId);
            console.log('Logs sheet verified or created.');
        } catch (error) {
            console.error('Failed to ensure Logs sheet:', error);
            return next(error); // Halt logging if this step fails
        }
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
    try {
        const sheets = await getGoogleSheetsService();
        console.log('Checking for Logs sheet...');
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetNames = metadata.data.sheets.map(sheet => sheet.properties.title);
        console.log('Available sheet names:', sheetNames);

        if (!sheetNames.includes('Logs')) {
            console.log('Logs sheet not found. Creating...');
            const response = await sheets.spreadsheets.batchUpdate({
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
            console.log('Logs sheet created:', response);

            // Add headers
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
        throw error; // Critical to halt further operations if this fails
    }
}

export default logAction;