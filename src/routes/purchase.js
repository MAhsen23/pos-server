const express = require('express');
const router = express.Router();
const purchaseController = require('../controller/purchase');
const { auth } = require('../middleware/auth');

router.post('/', auth, purchaseController.createPurchase);
module.exports = router;