
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Middleware and Routes
const { validateSpreadsheetId } = require('../middleware/validate');
const { logAction } = require('../middleware/log');
const punchRoutes = require('../routes/punch');
const sapRoutes = require('../routes/sap');
const editRoutes = require('../routes/edit');
const logsRoutes = require('../routes/logs');

// Required Setup for Missing Logic
const { google } = require('googleapis');
const moment = require('moment-timezone');
const errors = require('./errors');
const success = require('./success');

// Import utilities
const { getGoogleSheetsService, getCurrentDate, getCurrentTime, getCurrentMonthName } = require('../utils/googleSheetsUtils');

const app = express();
const PORT = process.env.PORT || 5000;

// General Middleware
app.use(express.json());
app.use(cors());
app.use(validateSpreadsheetId);
app.use(logAction);

// Modular Routes
app.use('/api/punch', punchRoutes);
app.use('/api/sap', sapRoutes);
app.use('/api/editEntry', editRoutes);
app.use('/api/logs', logsRoutes);

// Restored Missing Logic
async function getGoogleSheetsService() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

// Example of restoring one missing endpoint
app.post('/api/punchIn', async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.headers['spreadsheet-id'];
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const range = `${monthName}!A1:E1`;
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[currentDate, currentTime, 'Punch In']],
            },
        });
        res.status(200).json({ success: true, message: 'Punched In!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to punch in.' });
    }
});

// Start the Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
