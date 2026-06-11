const express = require("express");
const router = express.Router();

const {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  getSummary,
  getCategorySummary,
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addExpense);

router.get("/", protect, getExpenses);

router.get("/summary", protect, getSummary);

router.get(
  "/category-summary",
  protect,
  getCategorySummary
);

router.put("/:id", protect, updateExpense);

router.delete("/:id", protect, deleteExpense);

module.exports = router;