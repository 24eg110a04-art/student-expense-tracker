CREATE DATABASE IF NOT EXISTS student_expense_tracker;
USE student_expense_tracker;

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category ENUM('Food','Transport','Books','Fees','Shopping','Entertainment','Other') NOT NULL DEFAULT 'Other',
  transaction_type ENUM('income','expense') NOT NULL DEFAULT 'expense',
  expense_date DATE NOT NULL,
  notes VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (amount > 0)
);
