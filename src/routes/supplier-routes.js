const express = require('express');
const router = express.Router();
const supplierController = require('../controller/supplier-controller');
const { auth } = require('../middleware/auth');

router.get('/', auth, supplierController.getSuppliers);
router.get('/details/:id', auth, supplierController.getSupplier);
router.put('/:id', auth, supplierController.editSupplier);
router.get('/search', auth, supplierController.getSearchSuppliers);
module.exports = router;