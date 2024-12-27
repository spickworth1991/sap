import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath, pathToFileURL } from 'url';
import { logAction } from '../middleware/log.js';
import authRoute from '../routes/auth.js';
import entriesRoute from '../routes/entries.js';
import punchRoute from '../routes/punch.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());         // Enable Cross-Origin Resource Sharing
app.use(helmet());       // Add security headers

// Logging
console.log("Starting server...");

// Global middleware for logging actions
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/auth') || req.originalUrl.startsWith('/api/entries')) {
        return next();
    }
    logAction(req, res, next);
});

// Mount auth route explicitly (runs before dynamic routes)
app.use('/api/auth', authRoute);
app.use('/api/entries', entriesRoute);

// Explicitly load the Punch route
app.use('/api/punch', punchRoute);
console.log("Mounted /api/punch route explicitly");

// Dynamically load other routes from 'routes' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesPath = path.join(__dirname, '../routes');
fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js') && file !== 'auth.js' && file !== 'punch.js' && file !== 'entries.js') { // Skip auth.js and punch.js to avoid duplicate loading
        const routeName = '/' + file.replace('.js', '');
        console.log(`Loading route: /api${routeName}`);
        const filePath = path.join(routesPath, file);
        const fileUrl = pathToFileURL(filePath).href; // Convert to file:// URL
        import(fileUrl)
            .then((module) => {
                app.use(`/api${routeName}`, module.default);
            })
            .catch((err) => {
                console.error(`Error loading route ${file}:`, err);
            });
    }
});

// Apply logAction middleware to all routes
app.use(logAction);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});