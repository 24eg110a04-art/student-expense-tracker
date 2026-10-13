require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10
});

const categories = ['Food', 'Transport', 'Books', 'Fees', 'Shopping', 'Entertainment', 'Other'];
const transactionTypes = ['income', 'expense'];

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const expenseFields = "id, title, amount, category, transaction_type AS type, TO_CHAR(expense_date, 'YYYY-MM-DD') AS date, notes AS description";

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const { category, month } = req.query;
    let sql = `SELECT ${expenseFields} FROM expenses`;
    const conditions = [], values = [];
    if (category && categories.includes(category)) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      values.push(month);
      conditions.push(`TO_CHAR(expense_date, 'YYYY-MM') = $${values.length}`);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY expense_date DESC, id DESC';
    const { rows } = await pool.query(sql, values);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { title, amount, category, date, description = '', type = 'expense' } = req.body || {};
    const numericAmount = Number(amount);
    if (!title || !String(title).trim()) return res.status(400).json({ message: 'Please enter an expense title.' });
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Amount must be greater than zero.' });
    if (!categories.includes(category)) return res.status(400).json({ message: 'Choose a valid category.' });
    if (!isValidDate(date)) return res.status(400).json({ message: 'Choose a valid date.' });
    if (!transactionTypes.includes(type)) return res.status(400).json({ message: 'Choose a valid transaction type.' });
    if (String(title).trim().length > 120) return res.status(400).json({ message: 'Title must be 120 characters or fewer.' });
    if (String(description).length > 500) return res.status(400).json({ message: 'Notes must be 500 characters or fewer.' });

    const inserted = await pool.query(
      'INSERT INTO expenses (title, amount, category, transaction_type, expense_date, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [String(title).trim(), numericAmount, category, type, date, String(description).trim() || null]
    );
    const { rows } = await pool.query(
      `SELECT ${expenseFields} FROM expenses WHERE id = $1`,
      [inserted.rows[0].id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not save transaction. Check the database connection.' });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid transaction ID.' });
    const result = await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Transaction not found.' });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete transaction' });
  }
});

async function start() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
      category VARCHAR(32) NOT NULL CHECK (category IN ('Food', 'Transport', 'Books', 'Fees', 'Shopping', 'Entertainment', 'Other')),
      transaction_type VARCHAR(8) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
      expense_date DATE NOT NULL,
      notes VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const port = Number(process.env.PORT || 5000);
  app.listen(port, '0.0.0.0', () => console.log(`Student Expense Tracker API listening on port ${port}`));
}

start().catch((error) => {
  console.error('Could not start API:', error);
  process.exit(1);
});
