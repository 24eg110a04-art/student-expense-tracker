
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CATEGORIES = ["Food", "Transport", "Books", "Fees", "Shopping", "Entertainment", "Other"];

const localDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  title: "",
  amount: "",
  category: "Food",
  date: localDate(),
  description: "",
  type: "expense",
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/expenses`);

      if (!response.ok) {
        throw new Error(`Could not load expenses (${response.status}).`);
      }

      const data = await response.json();
      const records = Array.isArray(data)
        ? data
        : data.expenses || data.data || [];

      setExpenses(records);
    } catch (err) {
      setError(`${err.message} Check that the backend is running at ${API_URL}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totals = useMemo(() => {
    const income = expenses
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const spent = expenses
      .filter((item) => item.type !== "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      income,
      spent,
      balance: income - spent,
      count: expenses.length,
    };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        const text = `${item.title || ""} ${item.description || ""} ${
          item.category || ""
        }`.toLowerCase();

        const matchesSearch = text.includes(search.toLowerCase());
        const matchesCategory =
          categoryFilter === "All" || item.category === categoryFilter;
        const matchesType =
          typeFilter === "All" ||
          (typeFilter === "Income"
            ? item.type === "income"
            : item.type !== "income");

        return matchesSearch && matchesCategory && matchesType;
      })
      .sort((a, b) => new Date(`${b.date || b.expense_date}T00:00:00`) - new Date(`${a.date || a.expense_date}T00:00:00`));
  }, [expenses, search, categoryFilter, typeFilter]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function addExpense(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        amount: Number(form.amount),
        description: form.description.trim(),
      };

      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Failed to save the transaction.");
      }

      setForm({
        ...EMPTY_FORM,
        date: localDate(),
      });

      setMessage("Transaction added successfully.");
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id) {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Failed to delete the transaction.");
      }

      setExpenses((previous) =>
        previous.filter((item) => item.id !== id && item._id !== id)
      );

      setMessage("Transaction deleted.");
      await loadExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="PennyPath home">
          <span className="brand-icon">₹</span>
          <span>PennyPath</span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>
        <div className="nav-item active">
          <span>▦</span> Dashboard
        </div>
        <div className="nav-item">
          <span>↕</span> Transactions
        </div>
        <div className="nav-item">
          <span>◷</span> Spending overview
        </div>

        <div className="sidebar-bottom">
          <div className="avatar">S</div>
          <div>
            <strong>Student</strong>
            <small>Personal account</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR MONEY, MADE SIMPLE</p>
            <h1>Student Expense Tracker</h1>
            <p className="subtitle">
              Understand your spending and stay on top of your budget.
            </p>
          </div>
          <div className="today-badge">
            <span>●</span> Personal dashboard
          </div>
        </header>

        {error && (
          <div className="alert error" role="alert">
            <strong>Error:</strong> {error}
            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="alert success" role="status">
            {message}
            <button
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="summary-grid">
          <article className="summary-card balance-card">
            <div className="summary-top">
              <span>Available balance</span>
              <span className="summary-icon">₹</span>
            </div>
            <h2>{money(totals.balance)}</h2>
            <p>Income minus expenses</p>
          </article>

          <article className="summary-card">
            <div className="summary-top">
              <span>Total income</span>
              <span className="summary-icon green">↗</span>
            </div>
            <h2>{money(totals.income)}</h2>
            <p className="green-text">Money received</p>
          </article>

          <article className="summary-card">
            <div className="summary-top">
              <span>Total expenses</span>
              <span className="summary-icon orange">↘</span>
            </div>
            <h2>{money(totals.spent)}</h2>
            <p className="orange-text">Money spent</p>
          </article>

          <article className="summary-card">
            <div className="summary-top">
              <span>Transactions</span>
              <span className="summary-icon purple">≡</span>
            </div>
            <h2>{totals.count}</h2>
            <p>All recorded transactions</p>
          </article>
        </section>

        <div className="content-grid">
          <section className="panel form-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">KEEP TRACK</p>
                <h2>Add a transaction</h2>
              </div>
              <span className="heading-icon">＋</span>
            </div>

            <form onSubmit={addExpense}>
              <label htmlFor="type">Transaction type</label>
              <div className="type-switch">
                <button
                  type="button"
                  className={form.type === "expense" ? "selected expense" : ""}
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      type: "expense",
                    }))
                  }
                >
                  ↘ Expense
                </button>
                <button
                  type="button"
                  className={form.type === "income" ? "selected income" : ""}
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      type: "income",
                    }))
                  }
                >
                  ↗ Income
                </button>
              </div>

              <label htmlFor="title">Transaction title</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={updateForm}
                placeholder="e.g. Lunch, books, allowance"
                required
              />

              <label htmlFor="amount">Amount (₹)</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={updateForm}
                placeholder="0.00"
                required
              />

              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={updateForm}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={updateForm}
                required
              />

              <label htmlFor="description">Notes (optional)</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={updateForm}
                placeholder="Add a short note..."
                rows="3"
              />

              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Saving..." : "+ Add transaction"}
              </button>
            </form>
          </section>

          <section className="panel transactions-panel">
            <div className="panel-heading transactions-heading">
              <div>
                <p className="eyebrow">YOUR ACTIVITY</p>
                <h2>Recent transactions</h2>
              </div>
              <span className="count-badge">{filteredExpenses.length}</span>
            </div>

            <div className="filters">
              <input
                aria-label="Search transactions"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="⌕ Search transactions..."
              />

              <div className="filter-row">
                <select
                  aria-label="Filter by category"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="All">All categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by transaction type"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <option value="All">All types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expenses</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="empty-icon">◌</div>
                <h3>Loading transactions...</h3>
                <p>Please wait while we fetch your records.</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">₹</div>
                <h3>No transactions yet</h3>
                <p>
                  Add your first income or expense using the form to get
                  started.
                </p>
              </div>
            ) : (
              <div className="transaction-list">
                {filteredExpenses.map((item) => {
                  const id = item.id ?? item._id;
                  const isIncome = item.type === "income" || item.transaction_type === "income";
                  const transactionDate = item.date || item.expense_date;
                  const notes = item.description || item.notes;

                  return (
                    <article className="transaction-item" key={id}>
                      <div className={`transaction-icon ${isIncome ? "income" : ""}`}>
                        {isIncome ? "↗" : "↘"}
                      </div>

                      <div className="transaction-info">
                        <strong>{item.title || item.description || "Transaction"}</strong>
                        <span>
                          {item.category || "Other"} ·{" "}
                          {transactionDate
                            ? new Date(`${transactionDate.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "No date"}
                        </span>
                        {notes && <small>{notes}</small>}
                      </div>

                      <div className="transaction-amount">
                        <strong className={isIncome ? "green-text" : ""}>
                          {isIncome ? "+" : "−"}
                          {money(item.amount)}
                        </strong>
                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => deleteExpense(id)}
                          aria-label={`Delete ${item.title || "transaction"}`}
                          title="Delete transaction"
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <button
              className="refresh-button"
              type="button"
              onClick={loadExpenses}
              disabled={loading}
            >
              ↻ Refresh transactions
            </button>
          </section>
        </div>

        <footer className="footer">
          <span>PennyPath</span> · Small steps, smarter spending.
        </footer>
      </main>
    </div>
  );
}

export default App;
