
const jwt = require('jsonwebtoken');

function decodeToken(token) {
    try {
        const decoded = jwt.decode(token);
        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

module.exports = { decodeToken };
