import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath, pathToFileURL } from 'url';
import { logAction } from '../middleware/log.js';
import authRoute from '../routes/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());         // Enable Cross-Origin Resource Sharing
app.use(helmet());       // Add security headers

// Logging
console.log("Starting server...");

// Mount auth route explicitly (runs before dynamic routes)
app.use('/api/auth', authRoute);

// Global middleware for logging actions
app.use(logAction); // This makes logAction run for all requests except for /api/auth

// Resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically load all other routes from 'routes' directory
const routesPath = path.join(__dirname, '../routes');
fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js') && file !== 'auth.js') { // Skip auth.js to avoid duplicate loading
        const filePath = path.join(routesPath, file);
        const fileUrl = pathToFileURL(filePath).href; // Convert to file:// URL
        import(fileUrl)
            .then((module) => {
                const routeName = '/' + file.replace('.js', '');
                console.log(`Loading route: ${routeName}`);
                app.use(routeName, module.default);
            })
            .catch((err) => {
                console.error(`Error loading route ${file}:`, err);
            });
    }
});

// Default route for API base
app.get('/', (req, res) => res.json({ message: 'API is running' }));

// Export the app for serverless functions or direct use
export default app;
