//routes/reports.js
const express = require('express');
const router = express.Router();
const { getSalesReport, getInventoryReport, getProfitLossReport } = require('../controller/report-controller');
const { auth } = require('../middleware/auth');

router.get('/profitloss', auth, getProfitLossReport);
module.exports = router;