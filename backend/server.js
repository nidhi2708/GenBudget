const cors = require("cors");
console.log("USING THE LATEST SERVER FILE");
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");

const expenseRoutes = require("./routes/expenseRoutes");


dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.get("/test", (req, res) => {
    res.send("Test route working");
});
app.get("/", (req, res) => {
    res.send("GenBudget Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;
app.get("/api/profile", protect, (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user,
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
