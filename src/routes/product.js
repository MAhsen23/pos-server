const express = require('express');
const router = express.Router();
const productController = require('../controller/product');
const { auth } = require('../middleware/auth');

router.post('/', auth, productController.createProduct);
router.get('/', auth, productController.getAllProducts);
router.get('/details/:id', auth, productController.getProduct);
router.get('/meta', auth, productController.getProductCategoriesAndCompanies);
router.delete('/:id', auth, productController.deleteProduct);
router.put('/:id', auth, productController.editProduct)
module.exports = router;