// models/product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    company: { type: String, required: true },
    cost: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    wholesalePrice: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);