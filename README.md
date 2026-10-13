# Student Expense Tracker

A full-stack student expense tracker built with React, JavaScript, Node.js, Express, and MySQL.

## Features
- Add, view, and delete income and expenses
- Categories such as Food, Transport, Books, Fees, and Other
- Income, expense, and balance summaries
- Filter expenses by category
- MySQL persistence through an Express REST API

## Requirements
- Node.js (LTS)
- MySQL Server

## 1. Create the database
Open MySQL Workbench and run `backend/schema.sql`.

If you already created the older `expenses` table, run this once before starting the updated API:

```sql
ALTER TABLE expenses
  ADD COLUMN transaction_type ENUM('income','expense') NOT NULL DEFAULT 'expense';
```

## 2. Configure the backend
Open a terminal in `backend`:

```bash
npm install
```

Copy `.env.example` to `.env`, then update `DB_USER` and `DB_PASSWORD` to match your MySQL setup.

```bash
npm run dev
```

The API runs at http://localhost:5000.

## 3. Run the frontend
Open a second terminal in `frontend`:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## API endpoints
- `GET /api/expenses` — list expenses
- `POST /api/expenses` — create an expense
- `DELETE /api/expenses/:id` — delete an expense
- `GET /api/health` — check API/database connection
