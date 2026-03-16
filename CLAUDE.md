# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**AppraisalPro** — a recruitment activity tracking system. Only employees with the `recruitment_support` role log activities; `hr_manager` and `admin` roles exist but have no special features yet. The core business logic is the **on-time rule**: a recruitment report is considered on-time based on time-of-day windows (Pagi 08:30–12:00, Siang 12:01–17:30) relative to the interview datetime.

## Commands

### Backend (run from `backend/`)

```bash
uv sync                                          # install dependencies
uv run uvicorn main:app --reload                 # start API at http://localhost:8000
uv run alembic upgrade head                      # apply migrations
uv run alembic revision --autogenerate -m "msg"  # generate migration after models.py change
uv run alembic downgrade -1                      # roll back one migration
```

### Frontend (run from `frontend/`)

```bash
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:5173
npm run build        # production build
npx tsc --noEmit     # type-check without building
```

### Adding shadcn components

```bash
# Always run from frontend/
npx shadcn@latest add <component>           # add new component
npx shadcn@latest add <component> --overwrite  # regenerate existing component
npx shadcn@latest add --diff <component>    # preview upstream changes before overwriting
```

## Architecture

### Backend (`backend/`)

Single-file FastAPI app. All routes are in `main.py`; ORM models and Pydantic schemas share `models.py`; DB connection is in `database.py`.

The `is_ontime` flag is **computed server-side** in `main.py::_is_ontime()` on every create/update of a recruitment record — it is never accepted from the client.

Environment: requires `DATABASE_URL` in `backend/.env` (see `.env.example`). Uses PostgreSQL via SQLAlchemy + psycopg2.

### Frontend (`frontend/src/`)

React 19 + TypeScript SPA (Vite). No state management library — all state is local `useState`/`useMemo` per page.

**Key architectural points:**

- **`@` alias** maps to `frontend/src/` (configured in `vite.config.ts` and `tsconfig.json`).
- **Routing** is in `router.tsx`. `RecruitmentFormPage` serves three routes: new from recruitments list (`/recruitments/new`), new from employee detail (`/employees/:employeeId/records/new`), and edit (`/recruitments/:id/edit`). It reads `?employeeId` from search params for pre-selection.
- **`Layout.tsx`** wraps all routes with the collapsible sidebar and breadcrumb header. It fetches the employee name for detail-page breadcrumbs.
- **`pages/RecruitmentFormPage.tsx`** also handles PDF upload + auto-fill via `lib/pdf-parser.ts` (uses pdfjs-dist to extract candidate name, role, company, and datetimes from uploaded PDFs).
- **On-time computation runs twice**: server-side in Python (`main.py::_is_ontime`) for persistence, and client-side in TypeScript (`lib/is-ontime.ts` using dayjs) for real-time preview in the form. Both must stay in sync.

### UI Components (`frontend/src/components/ui/`)

shadcn/ui v4 with **New York** style, Tailwind CSS v4, Lucide icons. `components.json` configures the CLI. The `radix-ui` monorepo package (v1.4.3) is used instead of individual `@radix-ui/*` packages.

Custom components on top of shadcn:
- `components/Badge.tsx` — `RoleBadge` and `StatusBadge` wrapping shadcn `Badge` with `variant="outline"` + color classNames.
- `components/ConfirmDialog.tsx` — wraps `AlertDialog` for destructive confirmations.
- `components/AppSidebar.tsx` — sidebar nav with active-state detection via `useMatch`.
- `components/Layout.tsx` — sidebar provider + breadcrumb header using shadcn `Breadcrumb`.

### Data Flow

All API calls go through `src/api/employees.ts` and `src/api/recruitments.ts` which hit `http://localhost:8000`. There is no caching layer — pages call `load()` on mount and after mutations.

## On-Time Business Rule

Both implementations must agree:

| Scenario | On Time? |
|---|---|
| Same day, interview Pagi (08:30–12:00), report Pagi | Yes |
| Same day, interview Siang (12:01–17:30), report Siang | Yes |
| Same day, interview Pagi, report Siang | Yes |
| Next day (+1), interview Siang, report Pagi | Yes |
| Anything else | No |

`null` is returned/stored when either datetime is missing.
