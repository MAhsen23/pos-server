const Customer = require('../models/customer');
const mongoose = require('mongoose');

exports.getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const searchRegex = new RegExp(searchQuery, 'i');

        const query = {
            user: req.user._id,
            $or: [
                { name: searchRegex },
                { phoneNumber: searchRegex }
            ]
        };
        const totalCustomers = await Customer.countDocuments(query);
        const totalPages = Math.ceil(totalCustomers / limit);
        const customers = await Customer.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            customers,
            currentPage: page,
            totalPages,
            totalCustomers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getSearchCustomers = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.json([]);
    }
    try {
        const customers = await Customer.find({
            $or: [
                { name: { $regex: new RegExp(query, 'i') } },
                { phoneNumber: { $regex: new RegExp(query, 'i') } },
            ],
            user: req.user._id
        });
        res.json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error searching customers' });
    }
}

exports.getCustomer = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid customer ID' });
        const customer = await Customer.findOne({ _id: id, user: req.user._id });
        if (!customer)
            return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.editCustomer = async (req, res) => {
    try {
        const updatedCustomer = await Customer.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
        if (!updatedCustomer) {
            return res.status(404).json({
                message: "Customer not found"
            });
        }
        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};
