const mongoose = require('mongoose');
const { Invoice, Product, Expense, Purchase } = require('../models/model');

async function getProfitLossReport(req, res) {
    try {
        const { startDate, endDate } = req.query;
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

        console.log('--- Profit & Loss Report Data ---');
        console.log(`Start Date: ${startDate}`);
        console.log(`End Date: ${endDate}`);
        console.log(`Total Revenue: ${totalRevenue}`);
        console.log(`Total Cost: ${totalCost}`);
        console.log(`Gross Profit: ${grossProfit}`);
        console.log(`Total Expenses: ${totalExpenses}`);
        console.log(`Net Profit: ${netProfit}`);

        const profitTrend = await calculateProfitTrend(startDate, endDate);

        res.json({
            startDate,
            endDate,
            totalRevenue,
            totalCost,
            grossProfit,
            totalExpenses,
            netProfit,
            profitTrend
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating profit and loss report', error: error.message });
    }
}

async function calculateProfitTrend(startDate, endDate) {
    const salesTrend = await Invoice.aggregate([
        {
            $match: {
                date: { $gte: startDate, $lte: endDate },
                status: { $in: ['Completed', 'Partially Returned'] }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                revenue: { $sum: '$total' }
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
        return {
            date: sale._id,
            revenue: sale.revenue,
            expenses: expense.expenses,
            profit: sale.revenue - expense.expenses
        };
    });

    return profitTrend;
}

module.exports = { getProfitLossReport };