const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoice-controller');
const { auth } = require('../middleware/auth');

router.post('/', auth, invoiceController.createInvoice);
router.get('/', auth, invoiceController.getAllInvoices);
router.get('/:invoiceNumber', auth, invoiceController.getInvoiceDetails);

module.exports = router;