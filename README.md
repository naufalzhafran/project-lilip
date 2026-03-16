# AppraisalPro

A prototype employee appraisal system focused on the **Recruitment Support** role.
Each recruitment support employee has a personal log of recruitment activities — tracking candidates, interview schedules, and report submissions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Migrations | Alembic |
| Package manager | uv (backend), npm (frontend) |

---

## Project Structure

```
project-lilip/
├── backend/
│   ├── alembic/            # Migration files
│   ├── alembic.ini         # Alembic config
│   ├── database.py         # SQLAlchemy engine & session
│   ├── models.py           # ORM models + Pydantic schemas
│   ├── main.py             # FastAPI app & all API routes
│   ├── pyproject.toml      # Python dependencies (uv)
│   ├── .env                # Environment variables (never commit)
│   └── .env.example        # Template for .env
└── frontend/
    ├── src/
    │   ├── api/            # Fetch helpers (employees, recruitments)
    │   ├── components/     # Shared UI + shadcn components
    │   ├── lib/            # Utilities (on-time logic, PDF parser, cn)
    │   ├── pages/          # Page components and forms
    │   ├── hooks/          # use-mobile hook
    │   ├── types/          # Shared TypeScript types
    │   ├── router.tsx      # React Router v7 route config
    │   └── index.css       # Global styles & CSS design tokens
    ├── components.json     # shadcn/ui configuration
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **uv** — [install guide](https://docs.astral.sh/uv/getting-started/installation/)
- **PostgreSQL** server (local or remote)

---

## Backend Setup

### 1. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
```

### 2. Install dependencies

```bash
uv sync
```

### 3. Run database migrations

```bash
uv run alembic upgrade head
```

This creates the `employees` and `recruitment_data` tables.

### 4. Start the server

```bash
uv run uvicorn main:app --reload
```

API: **http://localhost:8000** — Swagger UI: **http://localhost:8000/docs**

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

App: **http://localhost:5173**

---

## API Overview

### Employees

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/employees` | List all employees |
| `GET` | `/employees/{id}` | Get a single employee |
| `POST` | `/employees` | Create an employee |
| `PUT` | `/employees/{id}` | Update an employee |
| `DELETE` | `/employees/{id}` | Delete an employee (cascades records) |

### Recruitment Records

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/recruitments` | List all records (with employee name) |
| `GET` | `/employees/{id}/recruitments` | List records for one employee |
| `GET` | `/recruitments/{id}` | Get a single record |
| `POST` | `/employees/{id}/recruitments` | Add a recruitment record |
| `PUT` | `/recruitments/{id}` | Update a record |
| `DELETE` | `/recruitments/{id}` | Delete a record |

The `is_ontime` field is computed server-side on every create/update and is never accepted from the client.

---

## Database Migrations

All commands must be run from the `backend/` directory.

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Generate a new migration after changing models.py
uv run alembic revision --autogenerate -m "describe your change"

# Check current migration version
uv run alembic current

# Roll back one migration
uv run alembic downgrade -1
```

Always commit migration files in `alembic/versions/` to version control.

---

## Employee Roles

| Role | Description |
|---|---|
| `recruitment_support` | Logs recruitment activities (candidates, interviews, reports) |
| `hr_manager` | HR manager (future use) |
| `admin` | System administrator (future use) |

Only `recruitment_support` employees have a **View** button on the employee list and a detail page showing their recruitment records.

---

## On-Time Rule

A recruitment report is considered on-time based on the time-of-day window of the interview vs. the report submission:

| Interview | Report | On Time? |
|---|---|---|
| Pagi (08:30–12:00) — same day | Pagi | Yes |
| Siang (12:01–17:30) — same day | Siang | Yes |
| Pagi — same day | Siang | Yes |
| Siang | Pagi next day (+1) | Yes |
| Anything else | | No |

If either datetime is missing, `is_ontime` is `null`. The form shows a real-time preview of this calculation before saving.
