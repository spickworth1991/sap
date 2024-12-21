
const express = require('express');
const app = express();
const { validateSpreadsheetId } = require('./middleware/validate');
const { logAction } = require('./middleware/log');
const entriesRoutes = require('./routes/entries');
const punchRoutes = require('./routes/punch');
const sapRoutes = require('./routes/sap');

app.use(express.json());
app.use(validateSpreadsheetId);
app.use(logAction);
app.use('/api/entries', entriesRoutes);
app.use('/api/punch', punchRoutes);
app.use('/api/sap', sapRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
