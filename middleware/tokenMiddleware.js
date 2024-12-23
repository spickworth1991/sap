
const { decodeToken } = require('../utils/token');

function tokenMiddleware(req, res, next) {
    const authToken = req.headers.authorization?.split(' ')[1]; // Expecting 'Bearer <token>'
    if (authToken) {
        const decoded = decodeToken(authToken);
        if (decoded) {
            req.user = decoded; // Attach decoded details to the request
        } else {
            console.error('Invalid token');
        }
    }
    next();
}

module.exports = { tokenMiddleware };
