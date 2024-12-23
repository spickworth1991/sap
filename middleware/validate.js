import jwt from 'jsonwebtoken';
export const validateSpreadsheetId = (req, res, next) => {
    const spreadsheetId = req.headers['spreadsheet-id'];
    if (!spreadsheetId) {
        return res.status(401).json({ error: 'Unauthorized: Spreadsheet ID is missing in request headers' });
    }
    req.spreadsheetId = spreadsheetId;
    next();
};

export const ensureAuthenticated = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
    }

    const token = authHeader.split(' ')[1]; // Extract the token
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verify the token
        req.user = decoded; // Attach user details to the request object
        req.spreadsheetId = decoded.spreadsheetId; // Extract spreadsheet ID
        req.username = decoded.username; // Extract username
        next(); // Proceed to the next middleware
    } catch (err) {
        console.error('Token validation error:', err);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
