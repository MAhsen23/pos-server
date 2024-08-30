const express = require('express');
const router = express.Router();
const expenseController = require('../controller/expense');
const { auth } = require('../middleware/auth');

router.post('/', auth, expenseController.createExpense);
router.get('/', auth, expenseController.getAllExpenses);
router.get('/meta', auth, expenseController.getExpenseCategories);
router.get('/details/:id', auth, expenseController.getExpense);
router.delete('/:id', auth, expenseController.deleteExpense);
router.put('/:id', auth, expenseController.editExpense)
module.exports = router;