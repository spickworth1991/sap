
const { google } = require('googleapis');
const moment = require('moment-timezone');

// Authenticate with Google Sheets API
async function getGoogleSheetsService() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

// Date and Time Utilities
function getCurrentMonthName() {
    return moment().tz('America/New_York').format('MMMM');
}

function getCurrentDate() {
    return moment().tz('America/New_York').format('MM/DD/YYYY');
}

function getCurrentTime() {
    return moment().tz('America/New_York').format('HH:mm:ss');
}

// Exported Functions
module.exports = {
    getGoogleSheetsService,
    getCurrentMonthName,
    getCurrentDate,
    getCurrentTime,
};
