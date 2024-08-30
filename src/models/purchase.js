const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    wholesalePrice: { type: Number, required: true },
    total: { type: Number, required: true }
});

const appliedTaxSchema = new mongoose.Schema({
    tax: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax', required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
    purchaseNumber: { type: String, unique: true, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    date: { type: Date, default: Date.now },
    items: [purchaseItemSchema],
    subtotal: { type: Number, required: true },
    appliedTaxes: [appliedTaxSchema],
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    balanceDue: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Completed', 'Partially Paid'], default: 'Pending' },
    notes: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
