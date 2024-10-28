const express = require('express');
const router = express.Router();
const purchaseController = require('../controller/purchase-controller');
const { auth } = require('../middleware/auth');

router.post('/', auth, purchaseController.createPurchase);
router.get('/', auth, purchaseController.getAllPurchases);
router.get('/:purchaseNumber', auth, purchaseController.getPurchaseDetails);
module.exports = router;