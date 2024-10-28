const { User, Invoice, Expense } = require('../models/model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, userId: user._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.mydetails = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSummaryAndRecentSales = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const currentMonthSales = await Invoice.aggregate([
            { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'Completed', user: req.user._id } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const currentMonthExpenses = await Expense.aggregate([
            { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, user: req.user._id } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const sales = currentMonthSales.length > 0 ? currentMonthSales[0].total : 0;
        const expenses = currentMonthExpenses.length > 0 ? currentMonthExpenses[0].total : 0;
        const profit = sales - expenses;

        const duePayments = await Invoice.aggregate([
            { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'Completed', user: req.user._id } },
            { $group: { _id: null, total: { $sum: { $subtract: ['$total', '$amountPaid'] } } } }
        ]);

        const recentSales = await Invoice.find({ status: 'Completed', user: req.user._id })
            .sort({ date: -1 })
            .limit(7)
            .populate('customer', 'name')
            .select('invoiceNumber date total customer');

        res.json({
            currentMonthSales: sales,
            currentMonthExpenses: expenses,
            currentMonthProfit: profit,
            duePayments: duePayments.length > 0 ? duePayments[0].total : 0,
            recentSales: recentSales
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};