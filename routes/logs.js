
const express = require('express');
const router = express.Router();
const { fetchLogs } = require('../utils/googleSheetsUtils');

router.get('/', fetchLogs);

module.exports = router;
