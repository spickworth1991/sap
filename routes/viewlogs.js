

// Import modules (using ES Modules syntax)
import express from 'express';
import localStorage from 'node-localstorage';
import { getGoogleSheetsService } from '../utils/googleSheetsUtils.js';
import { fetchLogs } from '../utils/googleSheetsUtils.js';

// Create the router instance
const router = express.Router();

router.get('/', fetchLogs, async (req, res) => {
    try {
      const spreadsheetId = localStorage.getItem('spreadsheetId');
      const sheets = await getGoogleSheetsService();
      const { date, search } = req.query;
  
      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
      }
  
      // Fetch logs from a sheet named "Logs"
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Logs!A:E', // Assuming logs are stored in columns A to E
      });
  
      let logs = response.data.values || [];
  
      // Convert logs to objects with headers: Date, Time, Username, Action, Details
      const headers = logs.shift();
      logs = logs.map(row => ({
        date: row[0],
        time: row[1],
        username: row[2],
        action: row[3],
        details: row[4],
      }));
  
      // Filter by date if provided
      if (date) {
        logs = logs.filter(log => log.date === date);
      }
  
      // Filter by search term if provided
      if (search) {
        const lowerSearch = search.toLowerCase();
        logs = logs.filter(log =>
          Object.values(log).some(value => value.toLowerCase().includes(lowerSearch))
        );
      }
  
      res.status(200).json({ logs });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });
      

export default router;;
