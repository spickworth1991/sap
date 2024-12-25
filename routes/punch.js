

import express from 'express';

import {
    getGoogleSheetsService,
    ensureHeaders,
    findDateRow,
    getCurrentTime,
    getCurrentDate,
    calculateElapsedTimeDecimal,
    formatElapsedTime,
    getCurrentMonthName,
    fetchSpreadsheetId,
} from '../utils/googleSheetsUtils.js';

const router = express.Router();

// Punch-in route
router.post('/in', async (req, res) => {
try {
    const spreadsheetId = await fetchSpreadsheetId();
    if (!spreadsheetId ) {
        return res.status(401).json({ error: 'missing spreadsheetID' });
    }

    res.json({ spreadsheetId });
} catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
}

});

// Punch-out route
router.post('/out',  async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const sapSheetName = `${monthName}:SAP`;
    

        // Find the row with the current date on the month sheet
        const rowIndex = await findDateRow(sheets, monthName, currentDate, spreadsheetId);
        if (!rowIndex) {
            return res.status(400).json({ message: 'No entry found for the current date.' });
        }

        // Check if Punch Out time already exists in Column E
        const punchOutResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: req.spreadsheetId,
            range: `${monthName}!E${rowIndex}`,
        });
        if (punchOutResponse.data.values?.[0]?.[0]) {
            return res.status(400).json({ message: 'Punch Out time already exists.' });
        }

        // Check if Punch In time exists in Column C
        const punchInResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: req.spreadsheetId,
            range: `${monthName}!C${rowIndex}`,
        });
        const punchInTime = punchInResponse.data.values?.[0]?.[0];
        if (!punchInTime) {
            return res.status(400).json({ message: 'No Punch In time found.' });
        }

        // Update the Punch Out time in Column E on the month sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId: req.spreadsheetId,
            range: `${monthName}!E${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentTime]] },
        });

        // Calculate elapsed time and SAP time, then update the SAP sheet
        const elapsed = calculateElapsedTimeDecimal(punchInTime, currentTime);
        const elapsedFormatted = formatElapsedTime(elapsed);

        // Append totals and Punch Out entry to the SAP sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: req.spreadsheetId,
            range: `${sapSheetName}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentDate, currentTime, 'Punch Out', elapsedFormatted, elapsed]] },
        });

        res.status(200).json({ message: 'Punch Out successful.' });
    } catch (error) {
        console.error('Error in Punch Out:', error);
        res.status(500).json({ message: 'Failed to Punch Out. Please try again.' });
    }
});

export default router;
