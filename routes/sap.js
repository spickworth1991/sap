
const express = require('express');
const router = express.Router();
const { sapInput } = require('../utils/googleSheetsUtils');

router.post('/input', sapInput);

module.exports = router;
