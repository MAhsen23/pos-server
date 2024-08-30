const Expense = require('../models/expense');
const mongoose = require('mongoose');

exports.createExpense = async (req, res) => {
    try {
        const expense = new Expense({ ...req.body, user: req.user._id });
        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllExpenses = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        const totalExpenses = await Expense.countDocuments();
        const expenses = await Expense.find({ user: req.user._id })
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 });

        const totalPages = Math.ceil(totalExpenses / limitNumber);
        res.json({
            expenses,
            currentPage: page,
            totalPages,
            totalExpenses
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getExpenseCategories = async (req, res) => {
    try {
        let categories = await Expense.find({ user: req.user._id }).select('category');
        categories = categories.map(category => category.category);
        categories = [...new Set(categories)];
        res.status(200).json({
            categories
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getExpense = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid expense ID' });
        const expense = await Expense.findOne({ _id: id, user: req.user._id });
        if (!expense)
            return res.status(404).json({ message: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.editExpense = async (req, res) => {
    try {
        const updatedExpense = await Expense.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true }
        );
        if (!updatedExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        res.status(200).json(updatedExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};