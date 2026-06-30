# ExpenseFlow — React + Python (FastAPI) Expense Tracker

A full-stack daily expense tracker with user authentication (JWT), a dashboard,
and spending analytics.

- **Frontend:** React 18 + Vite, React Router, Chart.js, Axios
- **Backend:** Python FastAPI, SQLAlchemy (SQLite by default), JWT auth, BCrypt password hashing

## Features

- Register / login with JWT-based stateless auth
- Add, list, and delete expenses (per-user, isolated)
- Dashboard stat cards: total spent, this month, transaction count, avg/day
- Analytics: spending-by-category doughnut chart + 14-day daily trend bar chart
- Filter transactions by category and search by description
- Dark / light mode toggle (remembers your choice, follows OS preference by default)

---

## Prerequisites

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

---

## 1. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy the example env file and edit the secret
copy .env.example .env   # Windows
# cp .env.example .env    # macOS/Linux
# IMPORTANT: change JWT_KEY in .env to your own long random secret.

# Run — database tables are created automatically on startup
uvicorn main:app --reload --port 5050
```

The API runs at **http://localhost:5050**.
Interactive OpenAPI docs are available at `/docs`.

The backend uses a local SQLite database (`expensetracker.db`) by default.
To use a different database, set `DATABASE_URL` in `.env` to any SQLAlchemy URL.

### API endpoints

| Method | Route                      | Auth | Description                |
|--------|----------------------------|------|----------------------------|
| POST   | `/api/auth/register`       | No   | Create account, returns JWT|
| POST   | `/api/auth/login`          | No   | Log in, returns JWT        |
| GET    | `/api/expenses`            | Yes  | List your expenses         |
| POST   | `/api/expenses`            | Yes  | Create an expense          |
| PUT    | `/api/expenses/{id}`       | Yes  | Update an expense          |
| DELETE | `/api/expenses/{id}`       | Yes  | Delete an expense          |
| GET    | `/api/expenses/summary`    | Yes  | Analytics summary          |

---

## 2. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# The API base URL is set in .env (VITE_API_URL=http://localhost:5050/api)

# Start the dev server
npm run dev
```

The app runs at **http://localhost:5173**.

---

## Notes

- CORS on the backend is configured to allow `http://localhost:5173`
  (change via `CORS_ALLOWED_ORIGIN` in `.env`).
- The JWT is stored in `localStorage` and attached to every request via an Axios
  interceptor. A 401 response clears the session and redirects to login.
- The theme (dark / light) is stored in `localStorage` and defaults to the OS
  `prefers-color-scheme` setting on first visit. Toggle it with the 🌙/☀️ button
  in the top-right of the login and dashboard screens.
- Passwords are hashed with BCrypt; raw passwords are never stored.
- For production: keep secrets in environment variables (never commit `.env`),
  serve the frontend build over HTTPS, and consider shorter token lifetimes
  with refresh tokens.

---

## 3. Deployment (Vercel + Render)

Deploy the app for free using **Vercel** (frontend) and **Render** (backend + PostgreSQL).

### Prerequisites

- A [GitHub](https://github.com) account with this repo pushed
- A [Render](https://render.com) account (free)
- A [Vercel](https://vercel.com) account (free)

### Step 1 — Create a Render PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**
2. Name: `expensetracker-db`
3. Plan: **Free**
4. Click **Create Database**
5. Once created, copy the **Internal Database URL** (starts with `postgresql://...`)

### Step 2 — Deploy the Backend on Render

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `expensetracker-api`
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** (auto-detected from `Procfile`)
   - **Plan:** Free
4. Add **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | *(paste the Internal Database URL from Step 1)* |
   | `JWT_KEY` | *(a long random secret — generate one with `openssl rand -hex 32`)* |
   | `JWT_ISSUER` | `ExpenseTrackerApi` |
   | `JWT_AUDIENCE` | `ExpenseTrackerClient` |
   | `JWT_EXPIRY_MINUTES` | `1440` |
   | `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` *(update after Vercel deploy)* |
5. Click **Deploy**
6. Once live, note your backend URL (e.g. `https://expensetracker-api.onrender.com`)

### Step 3 — Deploy the Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**
2. Import your GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add **Environment Variable:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://expensetracker-api.onrender.com/api` *(your Render URL + /api)* |
5. Click **Deploy**
6. Note your frontend URL (e.g. `https://your-app.vercel.app`)

### Step 4 — Update CORS on Render

1. Go back to your Render Web Service → **Environment**
2. Update `CORS_ALLOWED_ORIGINS` to your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
   For multiple origins (e.g. local + production), use comma-separated values:
   ```
   http://localhost:5173,https://your-app.vercel.app
   ```
3. Save — Render will auto-redeploy

### Done! 🎉

Your app is now live at your Vercel URL. Both services auto-deploy when you push to GitHub.

> **Note:** Render free tier sleeps after 15 minutes of inactivity.
> The first request after sleep takes ~30–60 seconds to wake up.

