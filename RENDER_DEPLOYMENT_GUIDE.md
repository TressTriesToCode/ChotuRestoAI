# Chotu Restro AI — Render Hosting Deployment Guide

This guide walks through deploying the complete **Chotu Restro AI** stack on [Render](https://render.com) using the included `render.yaml` Blueprint or manual web service creation.

---

## Architecture Overview on Render

The application deploys into 3 interconnected components:
1. **Managed PostgreSQL Database (`chotu-db`):** PostgreSQL 16 database storing all restaurant operational data, CRM, inventory, orders, and staff records.
2. **FastAPI Backend Web Service (`chotu-backend`):** Python 3.12 ASGI server running FastAPI with Alembic auto-migrations and WebSocket real-time event dispatch.
3. **Next.js Frontend Web Service (`chotu-frontend`):** Node.js 20 production server serving the hospitality UI, POS terminal, KDS, tables floor plan, and customer QR ordering.

---

## Method 1: 1-Click Blueprint Deployment (Recommended)

1. Log into your **[Render Dashboard](https://dashboard.render.com)**.
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository:
   ```
   https://github.com/sumit90asa-coder/Chotu-Restro-AI.git
   ```
4. Render will automatically detect [`render.yaml`](./render.yaml).
5. Click **Apply Blueprint**.
6. Render will automatically provision:
   - The PostgreSQL database.
   - The FastAPI backend (and run `alembic upgrade head`).
   - The Next.js frontend connected to the backend URL.

---

## Method 2: Manual Service Creation

If you prefer to configure each service manually:

### Step 1: Create PostgreSQL Database
1. Go to **New +** $\to$ **PostgreSQL**.
2. **Name:** `chotu-db`
3. **Database:** `chotu_restro_ai`
4. **User:** `chotu_admin`
5. **Plan:** Free (or Starter for high volume)
6. Once provisioned, copy the **Internal Database URL** (e.g. `postgres://...`).

### Step 2: Create FastAPI Backend Web Service
1. Go to **New +** $\to$ **Web Service**.
2. Connect your repository.
3. **Name:** `chotu-backend`
4. **Root Directory:** `backend`
5. **Runtime:** `Python 3`
6. **Build Command:**
   ```bash
   pip install -r requirements.txt && alembic upgrade head
   ```
7. **Start Command:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
8. **Environment Variables:**
   - `PYTHON_VERSION`: `3.12.4`
   - `DATABASE_URL`: *(paste the Internal Database URL from Step 1)*
   - `SECRET_KEY`: *(click Generate for a 32+ character random secret)*
   - `CORS_ORIGINS`: `*` (or your frontend URL)
   - `ENVIRONMENT`: `production`
9. **Health Check Path:** `/health`
10. Click **Create Web Service**. Note the deployed URL (e.g. `https://chotu-backend.onrender.com`).

### Step 3: Create Next.js Frontend Web Service
1. Go to **New +** $\to$ **Web Service**.
2. Connect your repository.
3. **Name:** `chotu-frontend`
4. **Root Directory:** *(leave blank for root)*
5. **Runtime:** `Node`
6. **Build Command:**
   ```bash
   npm install && npm run build
   ```
7. **Start Command:**
   ```bash
   npm run start
   ```
8. **Environment Variables:**
   - `NODE_VERSION`: `20.18.0`
   - `NEXT_PUBLIC_API_URL`: `https://chotu-backend.onrender.com/api/v1`
   - `NEXT_PUBLIC_WS_URL`: `wss://chotu-backend.onrender.com`
9. **Health Check Path:** `/`
10. Click **Create Web Service**.

---

## Default Admin Credentials

Upon initial launch, the database seeder automatically seeds the initial restaurant and admin account:
- **Email:** `admin@spicepavilion.com`
- **Password:** `Admin@12345`
- **Role:** `owner`

---

## Verification Checklist After Deployment

1. Visit `https://your-backend.onrender.com/health` $\to$ Should return `{"status": "healthy"}`.
2. Visit `https://your-backend.onrender.com/api/v1/docs` $\to$ Should display OpenAPI Swagger documentation.
3. Visit `https://your-frontend.onrender.com` $\to$ Should load the warm hospitality Landing Page.
4. Log into `/login` with the admin credentials $\to$ Should open the restaurant operations dashboard.
