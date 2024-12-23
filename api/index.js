import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet'; 

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());         // Enable Cross-Origin Resource Sharing
app.use(helmet());       // Add security headers

// Logging
console.log("Starting server...");

// Dynamically load all routes from 'routes' directory
const routesPath = path.join(path.resolve(), 'routes');
fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js')) {
        const route = await import(path.join(routesPath, file));
        const routeName = '/' + file.replace('.js', '');
        console.log(`Loading route: ${routeName}`);
        app.use(routeName, route.default);
    }
});

// Default route for API base
app.get('/', (req, res) => res.json({ message: 'API is running' }));

export default app;
