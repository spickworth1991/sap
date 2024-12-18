const express = require('express');
const authRoutes = require('./auth');
const successRoutes = require('./success');
const errorsRoutes = require('./errors');

const app = express();
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/success', successRoutes);
app.use('/api/errors', errorsRoutes);

// Placeholder routes for new functionalities
app.post('/api/clock/in', (req, res) => {
    res.json({ message: 'Clock-in successful' });
});

app.post('/api/clock/out', (req, res) => {
    res.json({ message: 'Clock-out successful' });
});

app.get('/api/entries', (req, res) => {
    res.json({ entries: 'Entries fetched successfully' });
});

app.post('/api/sap', (req, res) => {
    res.json({ message: 'SAP data submitted successfully' });
});

app.get('/', (req, res) => {
    res.send('API is running');
});

module.exports = app;