// Import modules (using ES Modules syntax)
import express from 'express';
import { getGoogleSheetsService } from '../utils/googleSheetsUtils.js';
import { ensureAuthenticated } from '../middleware/validate.js';
import { logAction } from '../middleware/log.js';

// Create the router instance
const router = express.Router();


// Punch-in route
router.post('/in', logAction, ensureAuthenticated, async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.spreadsheetId;

        if (!spreadsheetId) {
            return res.status(400).json({ error: 'Spreadsheet ID is missing' });
        }

        const userName = req.headers['username'] || 'Anonymous';
        const punchInTime = new Date().toISOString();

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Punches!A1',
            valueInputOption: 'RAW',
            resource: {
                values: [[userName, 'Punch-In', punchInTime]]
            }
        });

        res.status(200).json({ success: true, message: 'Punch-in recorded successfully' });
    } catch (error) {
        console.error('Error in punch-in route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Punch-out route
router.post('/out', logAction, ensureAuthenticated, async (req, res) => {
    try {
        const sheets = await getGoogleSheetsService();
        const spreadsheetId = req.spreadsheetId;

        if (!spreadsheetId) {
            return res.status(400).json({ error: 'Spreadsheet ID is missing' });
        }

        const userName = req.headers['username'] || 'Anonymous';
        const punchOutTime = new Date().toISOString();

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Punches!A1',
            valueInputOption: 'RAW',
            resource: {
                values: [[userName, 'Punch-Out', punchOutTime]]
            }
        });

        res.status(200).json({ success: true, message: 'Punch-out recorded successfully' });
    } catch (error) {
        console.error('Error in punch-out route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
