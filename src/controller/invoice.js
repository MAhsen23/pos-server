const Invoice = require('../models/invoice');
const Customer = require('../models/customer');
const Product = require('../models/product');
const Tax = require('../models/tax');

exports.createInvoice = async (req, res) => {
    let createdCustomer = null;
    let updatedProducts = [];
    try {
        const { isQuickSale, customer, items, subtotal, appliedTaxes, discount, total, paymentMethod, amountPaid, notes } = req.body;
        const userId = req.user._id;
        let customerId;

        console.log('Request body:', req.body);
        if (!isQuickSale) {
            if (!customer) {
                throw new Error("Customer details are required for non-quick sales");
            }
            let existingCustomer = await Customer.findOne({ phoneNumber: customer.phoneNumber, user: userId });
            if (existingCustomer) {
                customerId = existingCustomer._id;
            } else {
                const newCustomer = new Customer({ ...customer, user: userId });
                createdCustomer = await newCustomer.save();
                customerId = createdCustomer._id;
            }
        }

        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const lastInvoice = await Invoice.findOne({ user: userId }, {}, { sort: { 'invoiceNumber': -1 } });
        let sequence = 1;
        if (lastInvoice && lastInvoice.invoiceNumber) {
            sequence = parseInt(lastInvoice.invoiceNumber.slice(-4)) + 1;
        }
        const invoiceNumber = `INV-${year}${month}${day}${sequence.toString().padStart(4, '0')}`;

        let invoice = new Invoice({
            isQuickSale, customer: customerId, items, subtotal, appliedTaxes, discount, total, paymentMethod, amountPaid, notes, invoiceNumber, user: userId
        });

        for (let item of items) {
            const product = await Product.findOne({ _id: item.product, user: userId });
            if (!product) {
                throw new Error(`Product with id ${item.product} not found`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}`);
            }
            product.stock -= item.quantity;
            await product.save();
            updatedProducts.push({ product, quantity: item.quantity });
        }

        await invoice.save();
        res.status(201).json(invoice);
    } catch (error) {
        if (createdCustomer) {
            try {
                await Customer.findByIdAndDelete(createdCustomer._id);
            } catch (rollbackError) {
                console.error('Error rolling back customer creation:', rollbackError);
            }
        }

        for (let { product, quantity } of updatedProducts) {
            try {
                product.stock += quantity;
                await product.save();
            } catch (rollbackError) {
                console.error(`Error rolling back stock for product ${product._id}:`, rollbackError);
            }
        }
        res.status(400).json({ message: error.message });
    }
};

exports.getAllInvoices = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const totalInvoices = await Invoice.countDocuments({ user: req.user._id });
        const invoices = await Invoice.find({ user: req.user._id })
            .populate('customer', 'name phoneNumber')
            .populate('items.product', 'name')
            .populate('appliedTaxes.tax', 'name')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            invoices,
            currentPage: page,
            totalPages: Math.ceil(totalInvoices / limit),
            totalInvoices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
