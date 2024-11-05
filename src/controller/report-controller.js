const mongoose = require('mongoose');
const { Invoice, Product, Expense, Purchase } = require('../models/model');

async function getProfitLossReport(req, res) {
    try {
        const startDateTime = new Date(req.query.startDate);
        startDateTime.setHours(0, 0, 0, 0);

        const endDateTime = new Date(req.query.endDate);
        endDateTime.setHours(23, 59, 59, 999);

        const salesData = await Invoice.aggregate([
            {
                $match: {
                    date: {
                        $gte: startDateTime,
                        $lte: endDateTime
                    },
                    status: { $in: ['Completed', 'Partially Returned'] }
                }
            },
            {
                $unwind: '$items'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalCost: {
                        $sum: {
                            $multiply: ['$items.quantity', '$productDetails.cost']
                        }
                    }
                }
            }
        ]);

        const expenseData = await Expense.aggregate([
            {
                $match: {
                    date: {
                        $gte: startDateTime,
                        $lte: endDateTime
                    }
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
        const totalCost = salesData.length > 0 ? salesData[0].totalCost : 0;
        const totalExpenses = expenseData.length > 0 ? expenseData[0].totalExpenses : 0;

        const grossProfit = totalRevenue - totalCost;
        const netProfit = grossProfit - totalExpenses;

        console.log('--- Profit & Loss Report Data ---');
        console.log(`Start Date: ${startDateTime}`);
        console.log(`End Date: ${endDateTime}`);
        console.log(`Total Revenue: ${totalRevenue}`);
        console.log(`Total Cost: ${totalCost}`);
        console.log(`Gross Profit: ${grossProfit}`);
        console.log(`Total Expenses: ${totalExpenses}`);
        console.log(`Net Profit: ${netProfit}`);

        const profitTrend = await calculateProfitTrend(startDateTime, endDateTime);
        res.json({
            startDate: startDateTime,
            endDate: endDateTime,
            totalRevenue,
            totalCost,
            grossProfit,
            totalExpenses,
            netProfit,
            profitTrend
        });

    } catch (error) {
        console.error('Profit Loss Report Error:', error);
        res.status(500).json({
            message: 'Error generating profit and loss report',
            error: error.message
        });
    }
}

async function calculateProfitTrend(startDate, endDate) {
    try {
        const salesTrend = await Invoice.aggregate([
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
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    revenue: { $sum: '$total' },
                    cost: {
                        $sum: {
                            $multiply: ['$items.quantity', '$productDetails.cost']
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const expensesTrend = await Expense.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    expenses: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const profitTrend = salesTrend.map(sale => {
            const expense = expensesTrend.find(exp => exp._id === sale._id) || { expenses: 0 };
            const grossProfit = sale.revenue - sale.cost;
            return {
                date: sale._id,
                revenue: sale.revenue,
                cost: sale.cost,
                grossProfit: grossProfit,
                expenses: expense.expenses,
                profit: grossProfit - expense.expenses
            };
        });

        return profitTrend;
    } catch (error) {
        console.error('Calculate Profit Trend Error:', error);
        throw error;
    }
}

module.exports = { getProfitLossReport };