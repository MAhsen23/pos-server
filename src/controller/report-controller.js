const { Invoice, Purchase, Product, Customer, Supplier, Expense } = require('../models/model');

// Sales Report
exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user._id;

        const salesReport = await Invoice.aggregate([
            {
                $match: {
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    user: userId,
                    status: { $ne: 'Voided' },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                    totalDiscount: { $sum: '$discount' },
                    averageSale: { $avg: '$total' },
                    salesCount: { $sum: 1 },
                },
            },
        ]);

        const report = salesReport[0] || { totalSales: 0, totalDiscount: 0, averageSale: 0, salesCount: 0 };
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Example usage in Postman:
// GET http://localhost:3000/api/reports/sales?startDate=2023-01-01&endDate=2023-12-31

// Product Sales Report
exports.getProductSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user._id;

        const report = await Invoice.aggregate([
            {
                $match: {
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    user: userId,
                    status: { $ne: 'Voided' },
                },
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' },
                },
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo',
                },
            },
            { $unwind: '$productInfo' },
            {
                $project: {
                    productName: '$productInfo.name',
                    totalQuantity: 1,
                    totalRevenue: 1,
                },
            },
        ]);

        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Error generating product sales report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Example usage in Postman:
// GET http://localhost:3000/api/reports/productsales?startDate=2023-01-01&endDate=2023-12-31

// Inventory Report
exports.getInventoryReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const report = await Product.find({ user: userId }).select('name category stock cost retailPrice');
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Example usage in Postman:
// GET http://localhost:3000/api/reports/inventory

// Customer Report
exports.getCustomersReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const report = await Customer.aggregate([
            { $match: { user: userId } },
            {
                $lookup: {
                    from: 'invoices',
                    localField: '_id',
                    foreignField: 'customer',
                    as: 'invoices',
                },
            },
            {
                $project: {
                    name: 1,
                    phoneNumber: 1,
                    email: 1,
                    totalPurchases: { $size: '$invoices' },
                    totalSpent: { $sum: '$invoices.total' },
                },
            },
        ]);
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Error generating customer report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Example usage in Postman:
// GET http://localhost:3000/api/reports/customers

// Supplier Report
exports.getSuppliersReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const report = await Supplier.aggregate([
            { $match: { user: userId } },
            {
                $lookup: {
                    from: 'purchases',
                    localField: '_id',
                    foreignField: 'supplier',
                    as: 'purchases',
                },
            },
            {
                $project: {
                    name: 1,
                    phoneNumber: 1,
                    email: 1,
                    totalPurchases: { $size: '$purchases' },
                    totalSpent: { $sum: '$purchases.total' },
                },
            },
        ]);
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Error generating supplier report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Example usage in Postman:
// GET http://localhost:3000/api/reports/suppliers

// Expense Report
exports.getExpenseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user._id;
        const report = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    user: userId,
                },
            },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Error generating expense report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Example usage in Postman:
// GET http://localhost:3000/api/reports/expenses?startDate=2023-01-01&endDate=2023-12-31

// Profit and Loss Report
exports.getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const userId = req.user._id;

        const salesReport = await Invoice.aggregate([
            {
                $match: {
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    user: userId,
                    status: { $ne: 'Voided' },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$total' },
                },
            },
        ]);

        const expenseReport = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    user: userId,
                },
            },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: '$amount' },
                },
            },
        ]);

        const purchases = await Purchase.aggregate([
            {
                $match: {
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    user: userId,
                },
            },
            {
                $group: {
                    _id: null,
                    totalPurchases: { $sum: '$total' },
                },
            },
        ]);

        const totalSales = salesReport[0]?.totalSales || 0;
        const totalPurchases = purchases[0]?.totalPurchases || 0;
        const totalExpenses = expenseReport[0]?.totalExpenses || 0;
        const grossProfit = totalSales - totalPurchases;
        const netProfit = grossProfit - totalExpenses;

        const report = {
            totalSales,
            totalPurchases,
            grossProfit,
            totalExpenses,
            netProfit,
        };

        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Error generating profit and loss report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Example usage in Postman:
// GET http://localhost:3000/api/reports/profitloss?startDate=2023-01-01&endDate=2023-12-31