//routes/user.js
const express = require('express');
const router = express.Router();
const userController = require('../controller/user-controller');
const { auth } = require('../middleware/auth');

router.post('/login', userController.login)
router.get('/', userController.getAllUsers);
router.get('/me', auth, userController.mydetails);
router.post('/', userController.createUser);
router.get('/summary', auth, userController.getSummaryAndRecentSales);

module.exports = router;