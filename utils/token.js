const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

export function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

