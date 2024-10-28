const { Supplier } = require('../models/model');
const mongoose = require('mongoose');

exports.getSuppliers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalSuppliers = await Supplier.countDocuments({ user: req.user._id });
        const totalPages = Math.ceil(totalSuppliers / limit);
        const suppliers = await Supplier.find({ user: req.user._id })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            suppliers,
            currentPage: page,
            totalPages,
            totalSuppliers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSearchSuppliers = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.json([]);
    }
    try {
        const suppliers = await Supplier.find({
            $or: [
                { name: { $regex: new RegExp(query, 'i') } },
                { phoneNumber: { $regex: new RegExp(query, 'i') } },
            ],
            user: req.user._id
        });
        res.json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error searching suppliers' });
    }
}

exports.getSupplier = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid supplier ID' });
        const supplier = await Supplier.findOne({ _id: id, user: req.user._id });
        if (!supplier)
            return res.status(404).json({ message: 'Supplier not found' });
        res.json(supplier);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.editSupplier = async (req, res) => {
    try {
        const updatedSupplier = await Supplier.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
        if (!updatedSupplier) {
            return res.status(404).json({
                message: "Supplier not found"
            });
        }
        res.status(200).json(updatedSupplier);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};
