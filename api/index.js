const express = require('express');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');

const app = express();

app.use(express.json());

// Mount the auth and admin routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('API is running');
});

module.exports = app;