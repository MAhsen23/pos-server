//routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controller/report-controller');
const { auth } = require('../middleware/auth');

router.get('/sales', auth, reportController.getSalesReport);
router.get('/expenses', auth, reportController.getExpenseReport);
router.get('/profitloss', auth, reportController.getProfitLoss);
router.get('/inventory', auth, reportController.getInventoryReport);
router.get('/customers', auth, reportController.getCustomersReport);
router.get('/suppliers', auth, reportController.getSuppliersReport);
router.get('/productsales', auth, reportController.getProductSalesReport);

module.exports = router;