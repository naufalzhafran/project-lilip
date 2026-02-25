# AppraisalPro

A prototype employee appraisal system focused on the **Recruitment Support** role.
Each recruitment support employee has a personal log of recruitment activities — tracking candidates, interview schedules, and report submissions.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 19, Vite, CSS Modules             |
| Backend  | Python, FastAPI, SQLAlchemy             |
| Database | PostgreSQL                              |
| Migrations | Alembic                               |
| Package manager | uv (backend), npm (frontend)   |

---

## Project Structure

```
project-lilip/
├── backend/
│   ├── alembic/            # Migration files
│   ├── alembic.ini         # Alembic config
│   ├── database.py         # SQLAlchemy engine & session
│   ├── models.py           # ORM models + Pydantic schemas
│   ├── main.py             # FastAPI app & API routes
│   ├── pyproject.toml      # Python dependencies (uv)
│   ├── .env                # Environment variables (never commit)
│   └── .env.example        # Template for .env
└── frontend/
    ├── src/
    │   ├── api/            # Fetch helpers (employees, recruitments)
    │   ├── components/     # Shared UI components
    │   ├── pages/          # EmployeePage, DetailPage, forms
    │   ├── App.jsx         # Root layout + routing
    │   └── index.css       # Global styles & design tokens
    ├── index.html
    ├── package.json
    └── vite.config.js
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

Copy the example env file and fill in your database credentials:

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

This creates the `employees` and `recruitment_data` tables on your PostgreSQL server.

### 4. Start the server

```bash
uv run uvicorn main:app --reload
```

The API will be available at **http://localhost:8000**
Interactive docs (Swagger UI): **http://localhost:8000/docs**

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

The app will be available at **http://localhost:5173**

---

## API Overview

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/employees` | List all employees |
| `GET` | `/employees/{id}` | Get a single employee |
| `POST` | `/employees` | Create an employee |
| `PUT` | `/employees/{id}` | Update an employee |
| `DELETE` | `/employees/{id}` | Delete an employee |

### Recruitment Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/employees/{id}/recruitments` | List records for an employee |
| `POST` | `/employees/{id}/recruitments` | Add a recruitment record |
| `PUT` | `/recruitments/{id}` | Update a record |
| `DELETE` | `/recruitments/{id}` | Delete a record |

---

## Database Migrations

Migrations are managed with **Alembic**. All commands must be run from the `backend/` directory.

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Generate a new migration after changing models.py
uv run alembic revision --autogenerate -m "describe your change"

# Check current migration version
uv run alembic current

# View migration history
uv run alembic history

# Roll back one migration
uv run alembic downgrade -1
```

> Always commit migration files in `alembic/versions/` to version control.

---

## Employee Roles

| Role | Description |
|------|-------------|
| `recruitment_support` | Can log recruitment activities (candidates, interviews, reports) |
| `hr_manager` | HR manager role (future use) |
| `admin` | System administrator (future use) |

Only employees with the `recruitment_support` role have a **View** button on the employee list, which opens their recruitment records.
