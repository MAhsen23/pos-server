const { Product } = require('../models/model');
const mongoose = require('mongoose');

exports.createProduct = async (req, res) => {
    try {
        const existingProduct = await Product.findOne({ name: req.body.name, user: req.user._id });
        if (existingProduct) {
            return res.status(400).json({ message: 'Product already exists for this user' });
        }
        const product = new Product({
            ...req.body,
            user: req.user._id
        });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ user: req.user._id });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid product ID' });
        const product = await Product.findOne({ _id: id, user: req.user._id });
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.editProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true }
        );
        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getProductCategoriesAndCompanies = async (req, res) => {
    try {
        const products = await Product.find({ user: req.user._id }).select('category company');
        let categories = products.map(product => product.category);
        categories = [...new Set(categories)];
        let companies = products.map(product => product.company);
        companies = [...new Set(companies)];
        res.json({
            categories,
            companies
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};