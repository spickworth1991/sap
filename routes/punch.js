
const express = require('express');
const router = express.Router();
const { punchIn, punchOut } = require('../utils/googleSheetsUtils');

router.post('/in', punchIn);
router.post('/out', punchOut);

module.exports = router;
