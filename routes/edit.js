
const express = require('express');
const router = express.Router();
const { editEntry } = require('../utils/googleSheetsUtils');

router.post('/', editEntry);

module.exports = router;
