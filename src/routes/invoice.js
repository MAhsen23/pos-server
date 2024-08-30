const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoice');
const { auth } = require('../middleware/auth');

router.post('/', auth, invoiceController.createInvoice);
router.get('/', auth, invoiceController.getAllInvoices);

module.exports = router;