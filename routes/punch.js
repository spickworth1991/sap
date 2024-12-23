import express from 'express';
import { ensureAuthenticated } from '../middleware/validate.js';
import { logAction } from '../middleware/log.js';
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
router.post('/in', ensureAuthenticated, async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const monthSheetName = monthName;
        const sapSheetName = `${monthName}:SAP`;

        // Ensure headers are present in the SAP sheet
        await ensureHeaders(sheets, sapSheetName, currentDate);

        // Find the row with the current date on the month sheet
        const rowIndex = await findDateRow(sheets, monthSheetName, currentDate);
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

        res.status(200).json({ message: 'Punch In successful.' });
    } catch (error) {
        console.error('Error in Punch In:', error);
        res.status(500).json({ message: 'Failed to Punch In. Please try again.' });
    }
});

// Punch-out route
router.post('/out',  async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const monthSheetName = monthName;
        const sapSheetName = `${monthName}:SAP`;

        // Find the row with the current date on the month sheet
        const rowIndex = await findDateRow(sheets, monthSheetName, currentDate);
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