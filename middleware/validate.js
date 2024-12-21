
const validateSpreadsheetId = (req, res, next) => {
    const spreadsheetId = req.headers['spreadsheet-id'];
    if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID is missing in request headers' });
    }
    req.spreadsheetId = spreadsheetId;
    next();
};

module.exports = { validateSpreadsheetId };
