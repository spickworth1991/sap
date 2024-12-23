
export const validateSpreadsheetId = (req, res, next) => {
    const spreadsheetId = req.headers['spreadsheet-id'];
    if (!spreadsheetId) {
        return res.status(401).json({ error: 'Unauthorized: Spreadsheet ID is missing in request headers' });
    }
    req.spreadsheetId = spreadsheetId;
    next();
};

// ensureAuthenticated is adapted from validateSpreadsheetId for broader authentication purposes
export const ensureAuthenticated = (req, res, next) => {
    const spreadsheetId = req.headers['spreadsheet-id'];
    const userToken = req.headers['authorization'];

    if (!spreadsheetId || !userToken) {
        return res.status(401).json({ error: 'Unauthorized: Missing spreadsheet ID or user token' });
    }

    req.spreadsheetId = spreadsheetId;
    req.userToken = userToken;
    next();
};

export default { validateSpreadsheetId, ensureAuthenticated };
