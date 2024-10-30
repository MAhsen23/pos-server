//routes/reports.js
const express = require('express');
const router = express.Router();
const { getSalesReport, getInventoryReport, getProfitLossReport } = require('../controller/report-controller');
const { auth } = require('../middleware/auth');

router.get('/sales', auth, getSalesReport);
router.get('/profitloss', auth, getProfitLossReport);
router.get('/inventory', auth, getInventoryReport);

module.exports = router;