# Chotu Restro AI — Repository Cleanup & Optimization Plan

**Date:** November 23, 2026  
**Auditor:** Senior Software Architect & DevOps Engineer  
**Repository:** Chotu Restro AI (`c:\restro ai\choturestoai`)  
**Target Architecture:**
- **Frontend:** Next.js 15 (React 19, Tailwind CSS, TypeScript)
- **Backend:** Python 3.12+ FastAPI (Async ASGI, WebSockets)
- **Database:** PostgreSQL 16+ via `psycopg 3` driver (SQLAlchemy 2.x ORM, Alembic migrations)
- **Local Fallback:** Resilient in-memory/local SQLite fallback for standalone development without running PostgreSQL daemon

---

## 1. Executive Repository Audit

A comprehensive traversal of the workspace identified the following components:
1. **Frontend (`src/`):** 33 files across app routes, components, animations, mock data fallback, types, and API client modules.
2. **Backend (`backend/app/`):** 43 files across API v1 routers, core security/config, models, schemas, services, WebSockets, and database session management.
3. **Database (`database/`):** 5 authoritative PostgreSQL SQL artifacts (`schema.sql`, `indexes.sql`, `constraints.sql`, `seed.sql`, `README.md`).
4. **Migrations (`backend/alembic/`):** Active Alembic migration environment and initial schema revision.
5. **Tests (`backend/tests/`):** 9 test suites containing 13 automated tests with 100% pass rate.
6. **Root & Configs:** Package manifests, configuration files (`tsconfig.json`, `tailwind.config.ts`, `next.config.ts`), Docker deployment descriptors, and markdown documentation.

---

## 2. Proposed Deletions & Detailed Evaluation

| # | Item Path | Category | Why Unnecessary | References in Codebase | Functional Impact | Safe to Delete? |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `src/components/voice/ChotuVoiceStrip.tsx` | Unused Component | Legacy prototype component created prior to `ChotuVoiceModal.tsx`. Uses older dark theme color tokens (`bg-[#0E1015]`, `text-ochre`). | Zero references in any file across `src/` or `app/`. | None. The active voice assistant is `ChotuVoiceModal.tsx`. | **YES (Safe)** |
| **2** | `backend/app/database/base.py` | Redundant Module | 2-line redundant stub file (`from app.database.session import Base`). | Zero references. `alembic/env.py`, `models/`, and `main.py` import directly from `app.database.session`. | None. Eliminates circular/duplicate import path. | **YES (Safe)** |
| **3** | `backend/chotu_restro.db` | Obsolete SQLite DB | Stale SQLite database file created during early prototype testing. | Zero references. The active fallback database is `chotu_restro_ai.db`. | None. SQLite files are ephemeral local dev artifacts. | **YES (Safe)** |
| **4** | `backend/.pytest_cache/` | Test Cache | Ephemeral cache generated during test runs (`lastfailed`, `nodeids`). | Internal pytest cache only. | None. Auto-regenerates upon running pytest. | **YES (Safe)** |
| **5** | `backend/**/__pycache__/` | Python Bytecode | Compiled `.pyc` bytecode files across all subdirectories. | Python interpreter runtime cache. | None. Auto-regenerates as needed. | **YES (Safe)** |

---

## 3. Files and Modules Protected from Deletion

The following items were explicitly audited and **confirmed required** to preserve all functionality:

1. **`src/components/animations/*` (9 files):**
   - `ClickSpark.tsx`, `CountUp.tsx`, `DecryptedText.tsx`, `Magnet.tsx`, `ReactiveButton.tsx`, `ShinyText.tsx`, `SpotlightCard.tsx`, `Topography.tsx`, `Topography.css`, `TrueFocus.tsx`.
   - *Audit finding:* Every animation component is actively imported and rendered across `LandingPage.tsx`, `ReactiveButton.tsx`, `InventoryHub.tsx`, and `PosTerminal.tsx`. None are dead code.

2. **`database/*` (5 files):**
   - `schema.sql`, `indexes.sql`, `constraints.sql`, `seed.sql`, `README.md`.
   - *Audit finding:* Authoritative PostgreSQL 16 deliverables providing multi-tenant isolation, 33 normalized tables, and seed data for *The Spice Junction*.

3. **`backend/alembic/*` (3 files):**
   - `env.py`, `script.py.mako`, `versions/2026_11_22_001_initial_schema.py`.
   - *Audit finding:* Authoritative database migration pipeline configured for PostgreSQL.

4. **`backend/app/models/*` (9 files):**
   - `restaurant.py`, `user.py`, `table.py`, `menu.py`, `order.py`, `kot.py`, `inventory.py`, `payment.py`, `audit_log.py`.
   - *Audit finding:* Full relational model definitions matching PostgreSQL schema.

5. **`backend/app/schemas/*` (7 files) & `services/*` (6 files):**
   - Pydantic models and business services executing decimal financial math, atomic recipe deductions, KOT routing, and grounded AI assistant answers.

6. **`backend/tests/*` (9 files):**
   - 13 passing unit and end-to-end integration tests.

7. **`src/lib/api/*` (10 files):**
   - Central API client, WebSocket client, and endpoints connecting frontend components to the FastAPI backend.

8. **`src/data/mockData.ts`:**
   - Retained as safe fallback data structure for initial render and theme demo mode.

---

## 4. Configuration Consolidation Plan

1. **`docker-compose.yml` Alignment:**
   - Correct database driver in connection URL from `postgresql+psycopg2://` to `postgresql+psycopg://` (psycopg 3).
   - Align database name from `chotu_restro_db` to canonical `chotu_restro_ai`.
   - Ensure environment variables match `.env.example`.

2. **Comprehensive `.gitignore` Update:**
   - Include Python bytecode (`__pycache__/`, `*.pyc`).
   - Include Python virtual environments (`venv/`, `env/`, `.venv/`).
   - Include test and coverage artifacts (`.pytest_cache/`, `htmlcov/`, `.coverage`).
   - Include local database files (`*.db`, `*.sqlite`, `*.sqlite3`).
   - Include backend secret files (`backend/.env`, while preserving `backend/.env.example`).
   - Include OS metadata (`.DS_Store`, `Thumbs.db`).
   - Maintain all existing Next.js, Node, and TypeScript ignore rules.

---

## 5. Execution & Verification Sequence

1. Delete confirmed safe-to-remove files (`ChotuVoiceStrip.tsx`, `base.py`, `chotu_restro.db`, `__pycache__`, `.pytest_cache`).
2. Consolidate and update `backend/docker-compose.yml`.
3. Update `.gitignore` with production-grade rules.
4. Execute verification:
   - Backend test suite: `python -m pytest -v` (verify 13/13 passing).
   - Backend module imports and startup check.
   - Frontend production build: `npm run build` (verify 0 errors, 0 type warnings).
   - Validate API contracts between frontend and backend.
5. Generate `CLEANUP_REPORT.md`.
