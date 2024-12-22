
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// Middleware
app.use(express.json());

// Logging
const { setupLogging } = require('../middleware/logSetup');
setupLogging(app);

// Dynamically load all routes from 'routes' directory
const routesPath = path.join(__dirname, '../routes');
fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js')) {
        const route = require(path.join(routesPath, file));
        const routeName = '/' + file.replace('.js', '');
        app.use(routeName, route);
    }
});

// Default route for API base
app.get('/', (req, res) => res.json({ message: 'API is running' }));

module.exports = app;
