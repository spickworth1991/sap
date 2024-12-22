const morgan = require('morgan');

// Setup the logger to log to the console
const setupLogging = (app) => {
    app.use(morgan('combined'));
};

module.exports = { setupLogging };
