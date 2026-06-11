const Expense = require("../models/expense");

const addExpense = async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;

        const expense = await Expense.create({
            user: req.user.id,
            title,
            amount,
            category,
            date: date || Date.now(),
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({
            user: req.user.id,
        }).sort({ date: -1, createdAt: -1 });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        await expense.deleteOne();

        res.json({
            message: "Expense deleted",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found",
            });
        }

        expense.title =
            req.body.title || expense.title;

        expense.amount =
            req.body.amount || expense.amount;

        expense.category =
            req.body.category || expense.category;

        expense.date =
            req.body.date || expense.date;

        const updatedExpense =
            await expense.save();

        res.json(updatedExpense);

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
const getSummary = async (req, res) => {
    try {
        const expenses = await Expense.find({
            user: req.user.id,
        });

        const totalExpenses = expenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
        );

        res.json({
            totalExpenses,
            totalTransactions: expenses.length,
        });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const getCategorySummary = async (req, res) => {
    try {
        const expenses = await Expense.find({
            user: req.user.id,
        });

        const summary = {};

        expenses.forEach((expense) => {
            if (summary[expense.category]) {
                summary[expense.category] += expense.amount;
            } else {
                summary[expense.category] = expense.amount;
            }
        });

        res.json(summary);

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
module.exports = { 
    addExpense, 
    getExpenses,
    deleteExpense,
    updateExpense,
    getSummary,
    getCategorySummary,
};
