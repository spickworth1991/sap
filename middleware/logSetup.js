
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// Create a write stream (in append mode) for logging
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

// Setup the logger
const setupLogging = (app) => {
    app.use(morgan('combined', { stream: accessLogStream }));
};

module.exports = { setupLogging };
