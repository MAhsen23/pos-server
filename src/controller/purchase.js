const Purchase = require('../models/purchase');
const Product = require('../models/product');
const Supplier = require('../models/supplier');
const Tax = require('../models/tax'); // Import Tax model if not already done

exports.createPurchase = async (req, res) => {
    let createdSupplier;
    let createdProducts = [];
    let createdPurchase;

    try {
        const { items, appliedTaxes, supplier, paymentMethod, amountPaid, notes } = req.body;
        let subtotal = 0;
        let totalTax = 0;

        // Handle supplier
        let existingSupplier = await Supplier.findOne({ name: supplier.name, phoneNumber: supplier.phoneNumber, user: req.user._id });
        if (!existingSupplier) {
            existingSupplier = await new Supplier({ ...supplier, user: req.user._id }).save();
            createdSupplier = existingSupplier;
        }

        //Create Purchase Number
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const lastPurchase = await Purchase.findOne({ user: req.user._id }, {}, { sort: { 'purchaseNumber': -1 } });
        let sequence = 1;
        if (lastPurchase && lastPurchase.purchaseNumber) {
            sequence = parseInt(lastPurchase.purchaseNumber.slice(-4)) + 1;
        }
        const purchaseNumber = `PUR-${year}${month}${day}${sequence.toString().padStart(4, '0')}`;

        // Handle products
        for (const item of items) {
            const { productId, quantity, unitPrice, retailPrice, wholesalePrice, name, category, company } = item;
            let product = productId ? await Product.findOne({ _id: productId, user: req.user._id }) : null;

            if (!product) {
                product = await new Product({
                    name,
                    category,
                    company,
                    cost: unitPrice,
                    retailPrice,
                    wholesalePrice,
                    stock: quantity,
                    user: req.user._id
                }).save();
                createdProducts.push(product._id);
            } else {
                if (product.retailPrice !== retailPrice || product.wholesalePrice !== wholesalePrice) {
                    product.retailPrice = retailPrice;
                    product.wholesalePrice = wholesalePrice;
                }
                product.stock += quantity;
                await product.save();
            }

            const totalItemPrice = quantity * unitPrice;
            subtotal += totalItemPrice;
            item.product = product._id;
            item.total = totalItemPrice;
        }

        // Calculate taxes
        const taxes = appliedTaxes.map(({ tax, rate }) => {
            const amount = (subtotal * rate) / 100;
            totalTax += amount;
            return { tax, rate, amount };
        });
        const total = subtotal + totalTax;

        // Create purchase
        createdPurchase = await new Purchase({
            purchaseNumber: purchaseNumber,
            supplier: existingSupplier._id,
            date: req.body.date || Date.now(),
            items,
            subtotal,
            appliedTaxes: taxes,
            total,
            paymentMethod,
            amountPaid,
            balanceDue: total - amountPaid,
            status: amountPaid >= total ? 'Completed' : 'Pending',
            notes,
            user: req.user._id
        }).save();

        existingSupplier.balance += total - amountPaid;
        await existingSupplier.save();

        res.status(201).json(createdPurchase);
    } catch (error) {
        if (createdPurchase) await Purchase.findByIdAndDelete(createdPurchase._id);
        if (createdProducts.length) await Product.deleteMany({ _id: { $in: createdProducts } });
        if (createdSupplier) await Supplier.findByIdAndDelete(createdSupplier._id);
        res.status(400).json({ message: error.message });
    }
};
