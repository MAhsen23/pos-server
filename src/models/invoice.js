const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
});

const appliedTaxSchema = new mongoose.Schema({
    tax: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax', required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, unique: true, required: true },
    isQuickSale: { type: Boolean, default: false },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    date: { type: Date, default: Date.now },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    appliedTaxes: [appliedTaxSchema],
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    status: { type: String, enum: ['Completed', 'Refunded', 'Voided'], default: 'Completed' },
    notes: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);