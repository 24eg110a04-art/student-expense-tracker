CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(32) NOT NULL CHECK (category IN ('Food', 'Transport', 'Books', 'Fees', 'Shopping', 'Entertainment', 'Other')),
  transaction_type VARCHAR(8) NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense')),
  expense_date DATE NOT NULL,
  notes VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
