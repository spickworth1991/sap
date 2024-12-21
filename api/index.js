
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Middleware and Routes
const { validateSpreadsheetId } = require('../middleware/validate');
const { logAction } = require('../middleware/log');
const punchRoutes = require('../routes/punch');
const sapRoutes = require('../routes/sap');
const editRoutes = require('../routes/edit');
const logsRoutes = require('../routes/logs');
const logoutRoutes = require('../routes/logout');
const loginRoutes = require('../routes/login');

// Import utilities
const { getGoogleSheetsService, getCurrentDate, getCurrentTime, getCurrentMonthName } = require('../utils/googleSheetsUtils');

const app = express();
const PORT = process.env.PORT || 5000;

// General Middleware
app.use(express.json());
app.use(cors());
app.use(validateSpreadsheetId);
app.use(logAction);

// Modular Routes
app.use('/api/punch', punchRoutes);
app.use('/api/sap', sapRoutes);
app.use('/api/editEntry', editRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/logout', logoutRoutes)
app.use('/api/login', loginRoutes)

 
  // Start the Server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

