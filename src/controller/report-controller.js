const mongoose = require('mongoose');
const { Invoice, Product, Expense, Purchase } = require('../models/model');

function getDateRange(period, date) {
    const endDate = date ? new Date(date) : new Date();
    let startDate = new Date(endDate);

    switch (period) {
        case 'daily':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'weekly':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'monthly':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        default:
            throw new Error('Invalid period specified');
    }
    return { startDate, endDate };
}

async function getSalesReport(req, res) {
    try {
        const { period, date } = req.query;
        const { startDate, endDate } = getDateRange(period, date);

        const salesData = await Invoice.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    status: { $in: ['Completed', 'Partially Returned'] }
                }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.total' }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            {
                $unwind: '$productInfo'
            },
            {
                $project: {
                    productName: '$productInfo.name',
                    totalQuantity: 1,
                    totalRevenue: 1,
                    averagePrice: { $divide: ['$totalRevenue', '$totalQuantity'] }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        const totalSales = salesData.reduce((sum, item) => sum + item.totalRevenue, 0);
        const totalItems = salesData.reduce((sum, item) => sum + item.totalQuantity, 0);

        res.json({
            period,
            startDate,
            endDate,
            totalSales,
            totalItems,
            salesByProduct: salesData
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating sales report', error: error.message });
    }
}

async function getInventoryReport(req, res) {
    try {
        const { period, date } = req.query;
        const { startDate, endDate } = getDateRange(period, date);

        const inventoryData = await Product.aggregate([
            {
                $lookup: {
                    from: 'invoices',
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $gte: ['$date', startDate] },
                                        { $lte: ['$date', endDate] },
                                        { $in: ['$status', ['Completed', 'Partially Returned']] }
                                    ]
                                }
                            }
                        },
                        { $unwind: '$items' },
                        {
                            $match: {
                                $expr: { $eq: ['$items.product', '$$productId'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalSold: { $sum: '$items.quantity' }
                            }
                        }
                    ],
                    as: 'sales'
                }
            },
            {
                $lookup: {
                    from: 'purchases',
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $gte: ['$date', startDate] },
                                        { $lte: ['$date', endDate] },
                                        { $eq: ['$status', 'Completed'] }
                                    ]
                                }
                            }
                        },
                        { $unwind: '$items' },
                        {
                            $match: {
                                $expr: { $eq: ['$items.product', '$$productId'] }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalPurchased: { $sum: '$items.quantity' }
                            }
                        }
                    ],
                    as: 'purchases'
                }
            },
            {
                $project: {
                    name: 1,
                    category: 1,
                    currentStock: '$stock',
                    totalSold: { $ifNull: [{ $arrayElemAt: ['$sales.totalSold', 0] }, 0] },
                    totalPurchased: { $ifNull: [{ $arrayElemAt: ['$purchases.totalPurchased', 0] }, 0] },
                    stockChange: {
                        $subtract: [
                            { $ifNull: [{ $arrayElemAt: ['$purchases.totalPurchased', 0] }, 0] },
                            { $ifNull: [{ $arrayElemAt: ['$sales.totalSold', 0] }, 0] }
                        ]
                    }
                }
            },
            {
                $sort: { stockChange: 1 }
            }
        ]);

        res.json({
            period,
            startDate,
            endDate,
            inventoryData
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating inventory report', error: error.message });
    }
}

async function getProfitLossReport(req, res) {
    try {
        const { period, date } = req.query;
        const { startDate, endDate } = getDateRange(period, date);

        const salesData = await Invoice.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    status: { $in: ['Completed', 'Partially Returned'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' }
                }
            }
        ]);

        const purchaseData = await Purchase.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    status: 'Completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: '$total' }
                }
            }
        ]);

        const expenseData = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: '$amount' }
                }
            }
        ]);

        const totalRevenue = salesData.length > 0 ? salesData[0].totalRevenue : 0;
        const totalCost = purchaseData.length > 0 ? purchaseData[0].totalCost : 0;
        const totalExpenses = expenseData.length > 0 ? expenseData[0].totalExpenses : 0;
        const grossProfit = totalRevenue - totalCost;
        const netProfit = grossProfit - totalExpenses;

        res.json({
            period,
            startDate,
            endDate,
            totalRevenue,
            totalCost,
            grossProfit,
            totalExpenses,
            netProfit
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating profit and loss report', error: error.message });
    }
}

module.exports = { getSalesReport, getInventoryReport, getProfitLossReport };