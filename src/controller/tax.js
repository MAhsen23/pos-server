const Tax = require('../models/tax');

exports.createTax = async (req, res) => {
    try {
        const tax = new Tax({ ...req.body, user: req.user._id });
        await tax.save();
        res.status(201).json(tax);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllTaxes = async (req, res) => {
    try {
        const activeTaxes = await Tax.find({ isActive: true, user: req.user._id });
        res.json(activeTaxes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};