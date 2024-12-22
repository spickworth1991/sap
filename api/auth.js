
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Use environment variable for the secret key
const SECRET_KEY = process.env.SECRET_KEY;

// Original user data with spreadsheet IDs
const users = [
    { username: 'spickworth', password: bcrypt.hashSync('admin123', 10), role: 'admin', spreadsheetId: '19ernax6WLojBLh1OOBaU6IcDuKFxwLB4FL6pNVpqrGI' },
    { username: 'user1', password: bcrypt.hashSync('user123', 10), role: 'user', spreadsheetId: '1RzOAQmsdoWw3Df5G0625RlCpySZpEXx39oAnf0YM4PE' },
    { username: 'user2', password: bcrypt.hashSync('user123', 10), role: 'user', spreadsheetId: '1bu86Ld2p1BCXf-wubb9yW26KMigqdZldIeCt_ho12ss' },
];


