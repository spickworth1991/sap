

const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
require('dotenv').config();


// Middleware
app.use(express.json());

// Logging
console.log("Starting server...");

// Dynamically load all routes from 'routes' directory
const routesPath = path.join(__dirname, '../routes');

const authRoute = require(path.join(routesPath, 'auth.js'));
app.use('/api/auth', authRoute);

fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js')) {
        const route = require(path.join(routesPath, file));
        const routeName = '/' + file.replace('.js', '');
        console.log(`Loading route: ${routeName}`);
        app.use(routeName, route);
    }
});

// Default route for API base
app.get('/', (req, res) => res.json({ message: 'API is running' }));

module.exports = app;
