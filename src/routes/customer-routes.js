const express = require('express');
const router = express.Router();
const customerController = require('../controller/customer-controller');
const { auth } = require('../middleware/auth');

router.get('/', auth, customerController.getCustomers);
router.post('/', auth, customerController.createCustomer);
router.get('/details/:id', auth, customerController.getCustomer);
router.put('/:id', auth, customerController.editCustomer);
router.get('/search', auth, customerController.getSearchCustomers);
module.exports = router;