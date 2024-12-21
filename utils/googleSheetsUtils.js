
// utils/googleSheetsUtils.js
const { google } = require('googleapis');

const getGoogleSheetsService = async () => {
    const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
};

const getSheetData = async (sheets, spreadsheetId, range) => {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });
    return response.data.values || [];
};

const appendRow = async (sheets, spreadsheetId, range, values) => {
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });
};

const updateRow = async (sheets, spreadsheetId, range, values) => {
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
    });
};

const findRowByDate = async (sheets, spreadsheetId, sheetName, date) => {
    const rows = await getSheetData(sheets, spreadsheetId, `${sheetName}!A:A`);
    return rows.findIndex((row) => row[0] === date) + 1;
};

const ensureSheetExists = async (sheets, spreadsheetId, sheetName, headers) => {
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsNames = metadata.data.sheets.map((s) => s.properties.title);
    if (!sheetsNames.includes(sheetName)) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: { title: sheetName },
                        },
                    },
                ],
            },
        });
        await appendRow(sheets, spreadsheetId, `${sheetName}!A1:Z1`, headers);
    }
};

module.exports = {
    getGoogleSheetsService,
    getSheetData,
    appendRow,
    updateRow,
    findRowByDate,
    ensureSheetExists,
};
