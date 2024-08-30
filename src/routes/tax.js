const express = require('express');
const router = express.Router();
const taxController = require('../controller/tax');
const { auth } = require('../middleware/auth');

router.get('/', auth, taxController.getAllTaxes);
router.post('/', auth, taxController.createTax);
module.exports = router;