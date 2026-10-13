require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_expense_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

const categories = ['Food', 'Transport', 'Books', 'Fees', 'Shopping', 'Entertainment', 'Other'];
const transactionTypes = ['income', 'expense'];

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const expenseFields = "id, title, amount, category, transaction_type AS type, DATE_FORMAT(expense_date, '%Y-%m-%d') AS date, notes AS description";

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (error) { res.status(500).json({ status: 'error', message: 'Database connection failed' }); }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const { category, month } = req.query;
    let sql = `SELECT ${expenseFields} FROM expenses`;
    const conditions = [], values = [];
    if (category && categories.includes(category)) { conditions.push('category = ?'); values.push(category); }
    if (month && /^\d{4}-\d{2}$/.test(month)) { conditions.push("DATE_FORMAT(expense_date, '%Y-%m') = ?"); values.push(month); }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY expense_date DESC, id DESC';
    const [rows] = await pool.query(sql, values);
    res.json(rows);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Could not load expenses' }); }
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
    const [result] = await pool.execute(
      'INSERT INTO expenses (title, amount, category, transaction_type, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [String(title).trim(), numericAmount, category, type, date, String(description).trim() || null]
    );
    const [rows] = await pool.execute(`SELECT ${expenseFields} FROM expenses WHERE id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ message: 'Could not save expense. Check the database connection.' }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid expense ID.' });
    const [result] = await pool.execute('DELETE FROM expenses WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Expense not found.' });
    res.status(204).end();
  } catch (error) { console.error(error); res.status(500).json({ message: 'Could not delete expense' }); }
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`Student Expense Tracker API running at http://localhost:${port}`));
