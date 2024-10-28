const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Owner'], required: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Product Schema
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

// Customer Schema
const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    balance: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Supplier Schema
const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    balance: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Expense Schema
const expenseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Invoice Schema
const invoiceItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, unique: true, required: true },
    isQuickSale: { type: Boolean, default: false },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    date: { type: Date, default: Date.now },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    status: { type: String, enum: ['Completed', 'Returned', 'Partially Returned', 'Voided'], default: 'Completed' },
    notes: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Invoice Return Item Schema
const invoiceReturnItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
});

// Invoice Return Schema
const invoiceReturnSchema = new mongoose.Schema({
    returnNumber: { type: String, unique: true, required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    date: { type: Date, default: Date.now },
    items: [invoiceReturnItemSchema],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    refundMethod: { type: String, required: true },
    amountRefunded: { type: Number, required: true },
    status: { type: String, enum: ['Completed', 'Pending'], default: 'Completed' },
    notes: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Purchase Schema
const purchaseItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    retailPrice: { type: Number, required: true },
    wholesalePrice: { type: Number, required: true },
    total: { type: Number, required: true }
});

const purchaseSchema = new mongoose.Schema({
    purchaseNumber: { type: String, unique: true, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    date: { type: Date, default: Date.now },
    items: [purchaseItemSchema],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    amountPaid: { type: Number, required: true },
    balanceDue: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Completed', 'Partially Paid'], default: 'Pending' },
    notes: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Export models
module.exports = {
    User: mongoose.model('User', userSchema),
    Product: mongoose.model('Product', productSchema),
    Customer: mongoose.model('Customer', customerSchema),
    Supplier: mongoose.model('Supplier', supplierSchema),
    Expense: mongoose.model('Expense', expenseSchema),
    Invoice: mongoose.model('Invoice', invoiceSchema),
    Purchase: mongoose.model('Purchase', purchaseSchema),
    InvoiceReturn: mongoose.model('InvoiceReturn', invoiceReturnSchema)
};
