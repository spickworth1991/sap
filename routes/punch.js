
import express from 'express';
import { localStorage } from '../public/clockpage.js';
import {
    getGoogleSheetsService,
    ensureHeaders,
    findDateRow,
    getCurrentTime,
    getCurrentDate,
    calculateElapsedTimeDecimal,
    formatElapsedTime,
    getCurrentMonthName,
} from '../utils/googleSheetsUtils.js';

const router = express.Router();

// Punch-in route
router.post('/in', localStorage, async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const monthSheetName = monthName;
        const sapSheetName = `${monthName}:SAP`;

        // Retrieve spreadsheetId from decoded token (stored in req.user)
        const spreadsheetId = localStorage.getItem('spreadsheetId');
        if (!spreadsheetId) {
            return res.status(400).json({ error: 'Spreadsheet ID missing in user token.' });
        }

        // Ensure headers are present in the SAP sheet
        await ensureHeaders(sheets, sapSheetName, currentDate, spreadsheetId);

        // Find the row with the current date on the month sheet
        const rowIndex = await findDateRow(sheets, monthSheetName, currentDate, spreadsheetId);
        if (!rowIndex) {
            return res.status(400).json({ message: 'No entry found for the current date.' });
        }

        // Check if Punch In time already exists in Column C
        const punchInResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: req.spreadsheetId,
            range: `${monthSheetName}!C${rowIndex}`,
        });
        if (punchInResponse.data.values?.[0]?.[0]) {
            return res.status(400).json({ message: 'Punch In time already exists.' });
        }

        // Update the Punch In time in Column C on the month sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId: req.spreadsheetId,
            range: `${monthSheetName}!C${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentTime]] },
        });

        // Add Punch In entry to the SAP sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: req.spreadsheetId,
            range: `${sapSheetName}!A:E`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentDate, currentTime, 'Punch In', '', '']] },
        });

        return res.status(200).json({ message: 'Punch-in successful.' });
    } catch (error) {
        console.error('Error in Punch In:', error);
        return res.status(500).json({ error: 'An error occurred during Punch In.' });
    }
});

// Punch-out route
router.post('/out', localStorage,  async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const monthSheetName = monthName;
        const sapSheetName = `${monthName}:SAP`;
        const spreadsheetId = localStorage.getItem('spreadsheetId');

        // Find the row with the current date on the month sheet
        const rowIndex = await findDateRow(sheets, monthSheetName, currentDate, spreadsheetId);
        if (!rowIndex) {
            return res.status(400).json({ message: 'No entry found for the current date.' });
        }

        // Check if Punch Out time already exists in Column E
        const punchOutResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: req.spreadsheetId,
            range: `${monthSheetName}!E${rowIndex}`,
        });
        if (punchOutResponse.data.values?.[0]?.[0]) {
            return res.status(400).json({ message: 'Punch Out time already exists.' });
        }

        // Check if Punch In time exists in Column C
        const punchInResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: req.spreadsheetId,
            range: `${monthSheetName}!C${rowIndex}`,
        });
        const punchInTime = punchInResponse.data.values?.[0]?.[0];
        if (!punchInTime) {
            return res.status(400).json({ message: 'No Punch In time found.' });
        }

        // Update the Punch Out time in Column E on the month sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId: req.spreadsheetId,
            range: `${monthSheetName}!E${rowIndex}`,
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
