// Import modules (using ES Modules syntax)
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByUsername } from '../api/users.js';

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
router.post('/in', async (req, res) => {
    // Extract headers
    const { spreadsheetId, username, role } = req.body;
    const authHeader = req.headers.authorization;

    // Validate data
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    if (!spreadsheetId || !username || !role) {
        return res.status(400).json({ error: 'Required data missing in request body' });
    }

    try {
        // Assuming you have these utility functions available
        const sheets = await getGoogleSheetsService(); // Your method to connect to Google Sheets
        const currentDate = getCurrentDate();
        const currentTime = getCurrentTime();
        const monthName = getCurrentMonthName();
        const sapSheetName = `${monthName}:SAP`;


        // Find the row with the current date on the month sheet
        const rowIndex = await findDateRow(sheets, monthName, currentDate, spreadsheetId);
        console.log(`rowIndex: ${rowIndex}`);
        if (rowIndex ===null ) {
            return res.status(400).json({ message: 'No entry found for the current date.' });
        }

        // Check if Punch In time already exists in Column C
        const punchInResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${monthName}!C${rowIndex}`,
        });
        console.log(`punchInResponse: ${punchInResponse}`);
        if (punchInResponse.data.values?.[0]?.[0]) {
            return res.status(400).json({ message: 'Punch In time already exists.' });
        }

        // Update the Punch In time in Column C on the month sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${monthName}!C${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[currentTime]] },
        });
        // Ensure headers are present in the SAP sheet
        await ensureHeaders(sheets, sapSheetName, currentDate, spreadsheetId);

        // Add Punch In entry to the SAP sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
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