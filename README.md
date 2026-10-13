# Student Expense Tracker

A full-stack student expense tracker built with React, Vite, Node.js, Express, and PostgreSQL.

## Live deployment

- Frontend: https://student-expense-tracker-web.onrender.com
- Backend API: https://student-expense-tracker-api-m1dk.onrender.com
- API health: https://student-expense-tracker-api-m1dk.onrender.com/api/health

## Features

- Add, view, and delete income and expenses
- Categories such as Food, Transport, Books, Fees, and Other
- Income, expense, and balance summaries
- Search and filter transactions
- PostgreSQL persistence through an Express REST API

## Run locally

Requirements: Node.js (LTS) and a PostgreSQL database.

### 1. Configure the backend

Open a terminal in `backend`:

```bash
npm install
```

Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string. Then run:

```bash
npm run dev
```

The API runs at http://localhost:5000. On startup, it creates the `expenses` table if it does not already exist.

### 2. Configure the frontend

Open a second terminal in `frontend`:

```bash
npm install
npm run dev
```

The local frontend defaults to the API at http://localhost:5000/api. Open the local URL printed by Vite (usually http://localhost:5173).

## API endpoints

- `GET /api/expenses` — list transactions
- `POST /api/expenses` — create a transaction
- `DELETE /api/expenses/:id` — delete a transaction
- `GET /api/health` — check API/database connection

## Deployment notes

The Render API and static site automatically deploy from the `main` branch. The current Render Free PostgreSQL database expires on November 13, 2026; upgrade it before then to retain the database and its data.

This demo has no user authentication. Transactions are shared by anyone who opens the public site, and visitors can add or delete them. Use demo data only; do not enter private financial information.
