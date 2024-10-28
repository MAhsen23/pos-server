const { Invoice, Customer, Product, Purchase } = require('../models/model');

exports.createInvoice = async (req, res) => {
    let createdCustomer = null;
    let updatedProducts = [];
    console.log(req.body);
    try {
        const { isQuickSale, customer, items, subtotal, appliedTaxes, discount, total, paymentMethod, amountPaid, notes } = req.body;
        const userId = req.user._id;
        let customerId;

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
        console.log(error);
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
        res.status(400).json({ success: false, message: error.message });
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

exports.getCustomerInvoices = async (req, res) => {
    try {
        const { customerId } = req.params;
        const invoices = await Invoice.find({ customer: customerId, user: req.user._id })
            .populate('customer', 'name phoneNumber')
            .populate('items.product', 'name');

        if (!invoices) {
            return res.status(404).json({
                success: false,
                message: 'Invoices not found',
            });
        }
        res.status(200).json({
            success: true,
            invoices,
        });
    } catch (error) {
        console.error('Error fetching customer invoices:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getInvoiceDetails = async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        const invoice = await Invoice.findOne({ invoiceNumber, user: req.user._id })
            .populate('customer', 'name phoneNumber')
            .populate('items.product', 'name');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }
        res.status(200).json({
            success: true,
            invoice,
        });
    } catch (error) {
        console.error('Error fetching invoice details:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.createInvoiceReturn = async (req, res) => {
    let updatedProducts = [];
    try {
        const { invoiceNumber, items, refundMethod, amountRefunded, notes } = req.body;
        const userId = req.user._id;

        const invoice = await Invoice.findOne({ invoiceNumber, user: userId });
        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        let subtotal = 0;
        for (let returnItem of items) {
            const invoiceItem = invoice.items.find(item => item.product.toString() === returnItem.product);
            if (!invoiceItem) {
                throw new Error(`Product ${returnItem.product} not found in original invoice`);
            }
            if (returnItem.quantity > invoiceItem.quantity) {
                throw new Error(`Return quantity exceeds original quantity for product ${returnItem.product}`);
            }
            subtotal += returnItem.quantity * returnItem.price;
        }

        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const lastReturn = await InvoiceReturn.findOne({ user: userId }, {}, { sort: { 'returnNumber': -1 } });
        let sequence = 1;
        if (lastReturn && lastReturn.returnNumber) {
            sequence = parseInt(lastReturn.returnNumber.slice(-4)) + 1;
        }
        const returnNumber = `RET-${year}${month}${day}${sequence.toString().padStart(4, '0')}`;

        const invoiceReturn = new InvoiceReturn({
            returnNumber,
            invoice: invoice._id,
            items,
            subtotal,
            total: amountRefunded,
            refundMethod,
            amountRefunded,
            notes,
            user: userId
        });

        for (let item of items) {
            const product = await Product.findOne({ _id: item.product, user: userId });
            if (!product) {
                throw new Error(`Product with id ${item.product} not found`);
            }
            product.stock += item.quantity;
            await product.save();
            updatedProducts.push({ product, quantity: item.quantity });
        }

        const allItemsReturned = invoice.items.every(invoiceItem => {
            const returnItem = items.find(item => item.product.toString() === invoiceItem.product.toString());
            return returnItem && returnItem.quantity === invoiceItem.quantity;
        });
        invoice.status = allItemsReturned ? 'Returned' : 'Partially Returned';
        invoice.return = invoiceReturn._id;

        await invoiceReturn.save();
        await invoice.save();

        res.status(201).json({ success: true, invoiceReturn });
    } catch (error) {
        console.error('Error creating invoice return:', error);

        for (let { product, quantity } of updatedProducts) {
            try {
                product.stock -= quantity;
                await product.save();
            } catch (rollbackError) {
                console.error(`Error rolling back stock for product ${product._id}:`, rollbackError);
            }
        }
        res.status(400).json({ success: false, message: error.message });
    }
};