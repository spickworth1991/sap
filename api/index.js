const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

// Middleware
app.use(express.json());

// Logging
console.log("Starting server...");

// Explicitly mount auth.js at /api/auth
const authRoute = require(path.join(routesPath, 'auth.js'));
app.use('/api/auth', authRoute);

// Dynamically load all other routes
fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js') && file !== 'auth.js') {
        const route = require(path.join(routesPath, file));
        const routeName = '/' + file.replace('.js', '');
        console.log(`Loading route: ${routeName}`);
        app.use(routeName, route);
    }
});

// Default route for API base
app.get('/', (req, res) => res.json({ message: 'API is running' }));

module.exports = app;
