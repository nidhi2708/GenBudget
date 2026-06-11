import "./Dashboard.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API from "../services/api";

const categories = [
  "Food",
  "Travel",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Other",
];

const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#64748b",
];

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDateInput = (value) => {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  return new Date(value).toISOString().split("T")[0];
};

const formatDisplayDate = (value) => {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function Dashboard() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalTransactions: 0,
  });
  const [categorySummary, setCategorySummary] = useState({});
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [editId, setEditId] = useState(null);
  const [date, setDate] = useState(formatDateInput());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchExpenses = async () => {
    const res = await API.get("/expenses", getHeaders());
    setExpenses(res.data);
  };

  const fetchSummary = async () => {
    const res = await API.get("/expenses/summary", getHeaders());
    setSummary(res.data);
  };

  const fetchCategorySummary = async () => {
    const res = await API.get("/expenses/category-summary", getHeaders());
    setCategorySummary(res.data);
  };

  const refreshData = async () => {
    setLoading(true);

    try {
      await Promise.all([fetchExpenses(), fetchSummary(), fetchCategorySummary()]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const headers = getHeaders();
        const [expensesRes, summaryRes, categorySummaryRes] = await Promise.all([
          API.get("/expenses", headers),
          API.get("/expenses/summary", headers),
          API.get("/expenses/category-summary", headers),
        ]);

        if (isMounted) {
          setExpenses(expensesRes.data);
          setSummary(summaryRes.data);
          setCategorySummary(categorySummaryRes.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory(categories[0]);
    setDate(formatDateInput());
    setEditId(null);
  };

  const expensePayload = {
    title,
    amount: Number(amount),
    category,
    date,
  };

  const addExpense = async () => {
    try {
      await API.post("/expenses", expensePayload, getHeaders());
      resetForm();
      refreshData();
    } catch (error) {
      console.error(error);
    }
  };

  const updateExpense = async () => {
    try {
      await API.put(`/expenses/${editId}`, expensePayload, getHeaders());
      resetForm();
      refreshData();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) {
      return;
    }

    try {
      await API.delete(`/expenses/${id}`, getHeaders());
      refreshData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editId) {
      updateExpense();
    } else {
      addExpense();
    }
  };

  const handleEdit = (expense) => {
    setEditId(expense._id);
    setTitle(expense.title);
    setAmount(expense.amount);
    setCategory(expense.category);
    setDate(formatDateInput(expense.date || expense.createdAt));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const filteredExpenses = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return expenses;
    }

    return expenses.filter((expense) => {
      const expenseTitle = expense.title?.toLowerCase() || "";
      const expenseCategory = expense.category?.toLowerCase() || "";

      return expenseTitle.includes(query) || expenseCategory.includes(query);
    });
  }, [expenses, search]);

  const pieChartData = useMemo(
    () =>
      Object.entries(categorySummary).map(([name, value]) => ({
        name,
        value,
      })),
    [categorySummary]
  );

  const monthlyChartData = useMemo(() => {
    const monthlyTotals = {};

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      const month = expenseDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });

      monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(expense.amount);
    });

    return Object.entries(monthlyTotals).map(([month, total]) => ({
      month,
      total,
    }));
  }, [expenses]);

  const exportCSV = () => {
    const headers = ["Title", "Amount", "Category", "Date"];
    const rows = expenses.map((expense) => [
      expense.title,
      expense.amount,
      expense.category,
      formatDisplayDate(expense.date || expense.createdAt),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "genbudget-expenses.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={darkMode ? "dashboard dark-mode" : "dashboard"}>
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Expense Tracker</p>
          <h1>GenBudget Dashboard</h1>
        </div>

        <div className="dashboard-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setDarkMode((currentMode) => !currentMode)}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button className="logout-btn" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="summary-container">
        <div className="summary-card">
          <h3>Total Expenses</h3>
          <h2>{formatCurrency(summary.totalExpenses)}</h2>
        </div>

        <div className="summary-card">
          <h3>Total Transactions</h3>
          <h2>{summary.totalTransactions}</h2>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>Category Spending</h2>
          {loading ? (
            <p className="empty-state">Loading...</p>
          ) : pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">Add expenses to see category spending.</p>
          )}
        </div>

        <div className="chart-card">
          <h2>Monthly Expense Trend</h2>
          {loading ? (
            <p className="empty-state">Loading...</p>
          ) : monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">Add expenses to see monthly trends.</p>
          )}
        </div>
      </div>

      <div className="category-box">
        <h2>Category Summary</h2>

        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : Object.entries(categorySummary).length > 0 ? (
          Object.entries(categorySummary).map(([categoryName, totalAmount]) => (
            <p key={categoryName}>
              <strong>{categoryName}</strong>: {formatCurrency(totalAmount)}
            </p>
          ))
        ) : (
          <p>No category data yet.</p>
        )}
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <h2>{editId ? "Update Expense" : "Add Expense"}</h2>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          required
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          {categories.map((categoryName) => (
            <option key={categoryName} value={categoryName}>
              {categoryName}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div className="form-actions">
          <button type="submit">{editId ? "Update Expense" : "Add Expense"}</button>
          {editId && (
            <button className="secondary-btn" type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="expense-list-header">
        <h2>Expenses</h2>
        <button className="export-btn" type="button" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search by title or category"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : filteredExpenses.length > 0 ? (
        filteredExpenses.map((expense) => (
          <div className="expense-card" key={expense._id}>
            <div>
              <h3>{expense.title}</h3>
              <p>{formatCurrency(expense.amount)}</p>
              <p>{expense.category}</p>
              <p>{formatDisplayDate(expense.date || expense.createdAt)}</p>
            </div>

            <div className="expense-actions">
              <button
                className="edit-btn"
                type="button"
                onClick={() => handleEdit(expense)}
              >
                Edit
              </button>

              <button type="button" onClick={() => deleteExpense(expense._id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="empty-state">No expenses found. Add your first expense.</p>
      )}
    </div>
  );
}

export default Dashboard;
