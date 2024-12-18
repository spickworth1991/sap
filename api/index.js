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

app.get('/', (req, res) => {
    res.send('API is running');
});

module.exports = app;