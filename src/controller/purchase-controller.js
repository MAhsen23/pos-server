const { Purchase, Supplier, Product } = require('../models/model');

const generatePurchaseNumber = async (userId) => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const lastPurchase = await Purchase.findOne({ user: userId }, {}, { sort: { 'purchaseNumber': -1 } });
    let sequence = 1;
    if (lastPurchase && lastPurchase.purchaseNumber) {
        sequence = parseInt(lastPurchase.purchaseNumber.slice(-4)) + 1;
    }
    return `PUR-${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
};

exports.createPurchase = async (req, res) => {
    let createdSupplier;
    let createdProducts = [];
    let createdPurchase;
    try {
        const { items, supplier, paymentMethod, amountPaid, notes } = req.body;
        let subtotal = 0;
        let existingSupplier = await Supplier.findOne({ phoneNumber: supplier.phoneNumber, user: req.user._id });
        if (!existingSupplier) {
            existingSupplier = await new Supplier({ ...supplier, user: req.user._id }).save();
            createdSupplier = existingSupplier;
        }

        const purchaseNumber = await generatePurchaseNumber(req.user._id);
        for (const item of items) {
            const { product, quantity, unitPrice, retailPrice, wholesalePrice } = item;
            if (!product) {
                throw new Error('Product ID is missing in the item');
            }
            let existingProduct = await Product.findOne({ _id: product, user: req.user._id });

            if (!existingProduct) {
                throw new Error(`Product with id ${product} not found`);
            }

            if (existingProduct.retailPrice !== retailPrice || existingProduct.wholesalePrice !== wholesalePrice) {
                existingProduct.retailPrice = retailPrice;
                existingProduct.wholesalePrice = wholesalePrice;
            }
            existingProduct.stock += quantity;
            await existingProduct.save();
            const totalItemPrice = quantity * unitPrice;
            subtotal += totalItemPrice;
            item.product = existingProduct._id;
            item.total = totalItemPrice;
        }

        const total = subtotal;
        createdPurchase = await new Purchase({
            purchaseNumber: purchaseNumber,
            supplier: existingSupplier._id,
            date: req.body.date || Date.now(),
            items,
            subtotal,
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

exports.getAllPurchases = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const totalPurchases = await Purchase.countDocuments({ user: req.user._id });
        const purchases = await Purchase.find({ user: req.user._id })
            .populate('supplier', 'name phoneNumber address email')
            .populate('items.product', 'name category company cost retailPrice wholesalePrice')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit)
            .exec();

        res.status(200).json({
            success: true,
            purchases,
            currentPage: page,
            totalPages: Math.ceil(totalPurchases / limit),
            totalPurchases
        });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPurchaseDetails = async (req, res) => {
    try {
        const { purchaseNumber } = req.params;
        const purchase = await Purchase.findOne({ purchaseNumber, user: req.user._id })
            .populate('supplier', 'name phoneNumber address email')
            .populate('items.product', 'name category company cost retailPrice wholesalePrice');

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found',
            });
        }

        res.status(200).json({
            success: true,
            purchase,
        });
    } catch (error) {
        console.error('Error fetching purchase details:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getSupplierPurchases = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const purchases = await Purchase.find({ supplier: supplierId, user: req.user._id })
            .populate('supplier', 'name phoneNumber address email')
            .populate('items.product', 'name category company cost retailPrice wholesalePrice');

        res.status(200).json({
            success: true,
            purchases,
        });
    } catch (error) {
        console.error('Error fetching supplier purchases:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};