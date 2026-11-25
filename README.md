# Chotu Restro AI 🍽️⚡

> **The Intelligent Restaurant Operating System** — An artisanal, enterprise-grade hospitality platform uniting high-velocity Cloud POS, zero-commission QR dining, station-routed Kitchen Display Systems (KDS), inventory recipe consumption (BOM), delivery aggregator consolidation, CRM loyalty, and Hinglish voice billing into one synchronized ledger.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.6-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📖 Table of Contents

- [Overview & Architectural Philosophy](#-overview--architectural-philosophy)
- [Comprehensive Feature & Functional Breakdown](#-comprehensive-feature--functional-breakdown)
  - [1. Cloud POS & Dining Room Table Floor](#1-cloud-pos--dining-room-table-floor)
  - [2. Contactless Direct QR Ordering (0% Commission)](#2-contactless-direct-qr-ordering-0-commission)
  - [3. Real-Time Kitchen Display System (KDS) & KOT Routing](#3-real-time-kitchen-display-system-kds--kot-routing)
  - [4. Hinglish Multilingual Voice AI Assistant ("Ask Chotu")](#4-hinglish-multilingual-voice-ai-assistant-ask-chotu)
  - [5. Inventory, Recipe BOM & Food Cost Tracking](#5-inventory-recipe-bom--food-cost-tracking)
  - [6. Unified Delivery Aggregator Hub](#6-unified-delivery-aggregator-hub)
  - [7. CRM, Loyalty Points & Guest Profiling](#7-crm-loyalty-points--guest-profiling)
  - [8. Supplier Management & Purchase Orders](#8-supplier-management--purchase-orders)
  - [9. Business Analytics & Financial Reporting](#9-business-analytics--financial-reporting)
  - [10. Role-Based Access Control (RBAC) & Multi-Tenant Security](#10-role-based-access-control-rbac--multi-tenant-security)
- [Design System: Warm Terracotta & Espresso](#-design-system-warm-terracotta--espresso)
- [Full-Stack Architecture & Data Flow](#-full-stack-architecture--data-flow)
- [Database Schema & Entity Relationships](#-database-schema--entity-relationships)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Automated Testing Suite](#-automated-testing-suite)
- [Production Deployment Guide](#-production-deployment-guide)
- [License & Credits](#-license--credits)

---

## 🏛️ Overview & Architectural Philosophy

Modern dining establishments face severe operational friction: high aggregator commission deductions (up to 22%), counter clutter with multiple disparate tablets, disconnected kitchen paper tickets, manual inventory reconciliation, and complex POS systems that take weeks to train staff on.

**Chotu Restro AI** solves this through a unified, event-driven ledger. Every interaction—whether punched by a cashier at the counter, scanned by a guest via table QR, spoken in mixed Hindi/English through voice input, or received from third-party delivery aggregators—synchronously streams into a single PostgreSQL relational core. Kitchen stations receive tickets in under 2 seconds, inventory automatically deducts down to individual grams, and table states update in real time.

---

## ⚡ Comprehensive Feature & Functional Breakdown

### 1. Cloud POS & Dining Room Table Floor
* **Interactive Floor Plan**: Visual grid of all dining tables showing real-time occupancy status (`VACANT`, `OCCUPIED`, `RESERVED`, `BILLED`), seating capacity, assigned captain, active order ID, and elapsed dining duration.
* **Rapid Order Punching**: Sub-2-tap item selection with category navigation (Starters, Mains, Breads, Desserts, Beverages), dietary filters (`Veg`, `Non-Veg`), dish modifiers, and custom kitchen notes.
* **Table Independence & State Isolation**: Strict relational separation between tables. Adding or modifying items on Table 2 never leaks into Table 3.
* **Inter-Table Transfer Protocol**: Atomic transfer of orders and live bill balances from one table to another with full validation (preventing transfers to occupied tables, nonexistent tables, or empty source tables).
* **Automated Financial Calculations**: Strict 2-decimal financial math with statutory 5% GST (2.5% CGST + 2.5% SGST), configurable 5% service charge, itemized discounts, and total bill computation.
* **Multi-Modal Settlement**: Instant payment completion via UPI (QR payload generation), Cash, or Credit/Debit Card with transaction reference logging and immediate table vacation.

### 2. Contactless Direct QR Ordering (0% Commission)
* **Zero App Download**: Guests scan a table-specific QR card using any standard smartphone camera to open the live dining menu.
* **Cryptographic Token Security**: Every table is secured by a unique 256-bit cryptographically random token (`chotu_qr_*`) with constant-time SHA-256 hash lookup, eliminating predictable table URL tampering or cross-table injection.
* **Instant Table Association**: Orders placed via guest smartphones automatically attach to the correct table in the POS and set table status to `OCCUPIED`.
* **Out-of-Stock Protection**: Real-time stock status validation (`is_in_stock`) instantly rejects orders containing sold-out items with clear user feedback.
* **Zero Platform Cut**: Eliminates 18–22% commission fees by routing customer payments directly to the restaurant's UPI VPA.
* **Regeneration & Revocation**: Managers and Owners can instantly revoke and regenerate high-entropy QR tokens for any table with immediate invalidation of old codes.

### 3. Real-Time Kitchen Display System (KDS) & KOT Routing
* **Automatic Station Dispatch**: Incoming orders are split into Kitchen Order Tickets (KOTs) and routed to designated kitchen prep stations:
  * `tandoor`: Naans, rotis, kebabs, tikkas.
  * `curry`: Gravies, dals, biryanis, rice dishes.
  * `bar` / `pantry`: Mocktails, beverages, desserts, cold items.
* **SLA Timers & Urgency Tiers**: Elapsed ticket timers with color-coded urgency states:
  * *Green (Normal)*: Under 5 minutes.
  * *Amber (Warning)*: 5–10 minutes.
  * *Red (Urgent)*: Over 10 minutes.
* **Item-Level Prep Tracking**: Chefs can toggle prep status (`is_prepared`) for individual line items on a ticket as they cook.
* **Bump & Recall**: One-click ticket bumping upon completion, with instant recall capability to restore accidentally bumped tickets back to the active queue.

### 4. Hinglish Multilingual Voice AI Assistant ("Ask Chotu")
* **Counter-Tailored Speech Recognition**: Specially tuned for busy, noisy Indian restaurant environments where staff speak natural mixed Hindi and English (*Hinglish*).
* **Hands-Free Order Punching**: Translates spoken requests into structured API payloads (e.g., *"Chotu, Table 4 pe 2 Garlic Naan aur 1 Butter Chicken add karo"* parses into Table 4, Dish 01 x1, Dish 04 x2, and fires KOT).
* **Natural Language Data Queries**: Staff can ask operational queries hands-free:
  * *"Aaj ka total sales kitna hua?"* → Fetches today's gross revenue and settled order count.
  * *"Kaunse tables khali hain?"* → Lists currently vacant dining tables.
  * *"Konsa item low stock pe hai?"* → Identifies raw ingredients below reorder threshold.

### 5. Inventory, Recipe BOM & Food Cost Tracking
* **Bill of Materials (BOM) Recipe Mapping**: Every menu item is linked to standard ingredient consumption ratios (e.g., 1 portion of Butter Chicken consumes 250g Chicken, 40g Butter, 50g Cream, 100g Tomato Puree).
* **Atomic Stock Deduction**: Firing an order automatically decrements raw ingredient quantities from the database with transactional consistency.
* **Low-Stock Alerts**: Automatic trigger when stock falls below defined thresholds (e.g., `< 5 kg` for chicken), displaying visual warnings in POS and generating system notifications.
* **Weighted Average Cost (WAC)**: Automatically recalculates inventory value and unit cost when new purchase orders are received.

### 6. Unified Delivery Aggregator Hub
* **Counter Clutter Elimination**: Consolidates orders from Zomato, Swiggy, and direct website delivery into a single queue.
* **Channel Status Badges**: Color-coded badges with channel-specific metadata:
  * *Takeaway*: Pickup countdown timer and customer token.
  * *Direct Delivery*: Full delivery address, customer phone, and driver assignment.
  * *Aggregators*: Order integration status, estimated rider arrival, and handover OTP.
* **Handover OTP Verification**: Delivery orders require rider OTP verification before order handover, preventing wrong-order pickups and delivery shrinkage.
* **One-Click Store Pause**: Instant controls to toggle online store visibility during peak dining room rushes.

### 7. CRM, Loyalty Points & Guest Profiling
* **Automatic Phone Normalization**: Strips country codes, spaces, and formatting to store canonical 10-digit customer identifiers.
* **Loyalty Points Engine**: Automatic point accrual upon bill settlement (e.g., 1 point per ₹100 spent) with complete audit transaction logging.
* **Points Redemption**: Instant point redemption against bills at POS with balance verification and anti-negative balance enforcement.
* **Guest Insights**: Tracks total spend, visit frequency, favorite dishes, and average order value (AOV).

### 8. Supplier Management & Purchase Orders
* **Supplier Directory**: Contact details, GST numbers, payment terms, and supplied ingredient catalogs.
* **Purchase Order Lifecycle**: Create, approve, receive, and complete POs with automatic inventory stock increment and ledger logging.

### 9. Business Analytics & Financial Reporting
* **Real-Time Revenue Metrics**: Gross sales, net revenue, GST collection breakdown (CGST/SGST), and service charge totals.
* **Channel Distribution**: Percentage breakdown across Dine-In, Takeaway, and Online Delivery channels.
* **Hourly Rush Patterns**: Identifies peak lunch and dinner hours to optimize kitchen staffing.
* **Category Performance**: High-margin winners vs. slow-moving dishes for menu engineering.

### 10. Role-Based Access Control (RBAC) & Multi-Tenant Security
* **Granular Role Hierarchy**:
  * `OWNER`: Full administrative, financial, tax rate, and restaurant configuration access.
  * `MANAGER`: Floor operations, table transfers, KDS oversight, and QR regeneration.
  * `CASHIER`: POS order punching, billing, discount application, and settlement.
  * `KITCHEN_STAFF`: KDS view, item prep toggle, and ticket bumping.
  * `WAITER`: Table order entry and captain note dispatch.
* **Bcrypt Password Security**: Passwords hashed using industry-standard bcrypt algorithms.
* **JWT Access Tokens**: Cryptographically signed access tokens with role claims and multi-tenant restaurant scoping.

---

## 🎨 Design System: Warm Terracotta & Espresso

Engineered specifically for hospitality environments where clarity and warm dining aesthetics are paramount:

* **Canvas Background** (`#FAF8F5`): Warm, organic tone reminiscent of linen and textured ceramic.
* **Surfaces & Cards** (`#FFFFFF` / `#F5F2EB`): High-contrast, tactile containers with subtle borders.
* **Primary Text** (`#1E1B18`): Deep espresso for crisp legibility under dim bistro lighting.
* **Muted Text** (`#6E675F`): Calm taupe for secondary metadata, timestamps, and captions.
* **Brand Accent** (`#D95D39`): Burnt terracotta serving as an appetite-stimulating primary action cue.

### Switchable Theme Modes
1. **Terracotta (Warm Espresso & Terracotta)**: Default theme for cafes, dining rooms, and artisanal bistros.
2. **Cream (Warm Dining)**: High-energy family dining and pizzerias.
3. **Café (Fresh Minimal Green)**: Healthy bowl bars, bakeries, and breakfast bistros.
4. **Slate (High-Volume Coral)**: Modern QSRs, cloud kitchens, and urban brewpubs.

---

## 🏗️ Full-Stack Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT FRONTEND                               │
│            Next.js 15 (App Router) • React 19 • TypeScript             │
│   ┌────────────────┬─────────────────┬────────────────┬────────────┐   │
│   │   Cloud POS    │  Guest QR Menu  │  Kitchen KDS   │  Delivery  │   │
│   └────────────────┴─────────────────┴────────────────┴────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST & WebSocket (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│                         FASTAPI BACKEND (Python 3.12)                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Routers: /pos, /qr, /kds, /orders, /menu, /tables, /inventory  │   │
│   │ Routers: /auth, /settings, /customers, /delivery, /suppliers   │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │ Service Layer & RBAC Dependencies │
│   ┌────────────────────────────────▼───────────────────────────────┐   │
│   │ Services: OrderService, BillingService, KitchenService,        │   │
│   │           InventoryService, CRMService, AIService              │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │ SQLAlchemy 2.0 ORM                │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ Psycopg 3 Driver
┌────────────────────────────────────▼───────────────────────────────────┐
│                    POSTGRESQL 16 RELATIONAL DATABASE                    │
│   ┌────────────────┬─────────────────┬────────────────┬────────────┐   │
│   │  Restaurants   │  Dining Tables  │     Orders     │  KOT Items │   │
│   ├────────────────┼─────────────────┼────────────────┼────────────┤   │
│   │   Menu Items   │   Ingredients   │    Recipes     │  Payments  │   │
│   ├────────────────┼─────────────────┼────────────────┼────────────┤   │
│   │   Customers    │    Suppliers    │ Notifications  │ Staff/RBAC │   │
│   └────────────────┴─────────────────┴────────────────┴────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema & Entity Relationships

The primary database utilizes PostgreSQL 16 with relational integrity, foreign keys, and indexes:

* `restaurants`: Root multi-tenant restaurant profiles, business hours, GSTIN, FSSAI, and tax rates.
* `users`: Staff accounts with role assignments and hashed credentials.
* `dining_tables`: Floor tables, capacities, QR tokens, occupancy states, and active bill amounts.
* `table_qr_tokens`: Secure 256-bit entropy tokens mapped to individual tables.
* `menu_categories`: Hierarchical categories (Mains, Breads, Starters, Beverages, Desserts).
* `menu_items`: Dish catalog, pricing, dietary indicators (`veg`/`nonveg`), and kitchen station routing.
* `orders` & `order_items`: Central orders ledger tracking channel source (`pos`, `qr`, `delivery`), items, and financial totals.
* `kot_tickets` & `kot_items`: Kitchen tickets with station routing, item preparation flags, and bump audit records.
* `payments`: Settlement audit records with method (`upi`, `cash`, `card`), status, and transaction references.
* `ingredients`: Raw material inventory with stock quantities, units (`kg`, `g`, `l`), and reorder levels.
* `recipes` & `recipe_ingredients`: Bill of Materials (BOM) linking dishes to precise ingredient consumption ratios.
* `customers` & `loyalty_transactions`: Customer profiles, normalized phone numbers, and loyalty points ledger.
* `suppliers` & `purchase_orders`: Vendor records and purchase order restock history.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
* **Node.js**: v18.18 or higher (v20+ recommended)
* **Python**: 3.11 or 3.12
* **PostgreSQL**: Version 15 or 16

### 1. Clone Repository
```bash
git clone https://github.com/sumit90asa-coder/Chotu-Restro-AI.git
cd Chotu-Restro-AI
```

### 2. Frontend Setup
```bash
# Install NPM dependencies
npm install

# Run frontend dev server
npm run dev
```
The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation will be available at [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs).

---

## 🧪 Automated Testing Suite

The repository contains an automated regression suite covering all critical workflows, RBAC restrictions, financial calculations, and database integrations.

To execute the test suite against the PostgreSQL test database:
```bash
cd backend
.\venv\Scripts\pytest.exe -v
```

### Test Coverage Matrix (52 Domain Tests)
* `test_auth.py`: User authentication, bcrypt hash validation, JWT claims, 401 unauthorized handling.
* `test_admin_and_crm.py`: RBAC permissions, restaurant settings, phone normalization, loyalty accrual/redemption, delivery OTP verification, supplier purchase orders.
* `test_pos_operations.py`: Table isolation, item additions, quantity decrements, GST 5% bifurcation, service charge, table transfer validation, KOT generation & bump.
* `test_qr_order.py`: Guest QR menu fetching, table details, order submission, out-of-stock rejection, token validation.
* `test_qr_security.py`: 256-bit token entropy, constant-time lookup, session isolation, cross-table tamper immunity, price manipulation protection, idempotency.
* `test_kds.py`: Kitchen Display System station routing, prep toggle, ticket bumping, and ticket recall.
* `test_inventory.py`: Raw ingredient tracking and low-stock threshold alert generation.
* `test_e2e_lifecycle.py`: Complete cross-module lifecycle (QR Scan → Menu → Order → POS → KDS Bump → Settlement → Table Vacation → Analytics).
* `test_postgres_integration.py`: Relational PostgreSQL database connection, foreign key constraints, models, and transactions.
* `test_analytics.py`: Revenue calculation and business analytics endpoints.
* `test_ai.py`: Chotu AI natural language sales, occupancy, and inventory queries.

---

## 🌐 Production Deployment Guide

### Render Deployment
The project is configured for deployment on [Render](https://render.com) using the root configuration file [`render.yaml`](render.yaml):

1. **PostgreSQL Managed Database**:
   * PostgreSQL 16 database instance provisioned via Render.
2. **FastAPI Web Service**:
   * Environment: Python 3.12
   * Build command: `pip install -r backend/requirements.txt`
   * Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Next.js Frontend Web Service**:
   * Environment: Node.js
   * Build command: `npm install && npm run build`
   * Start command: `npm run start`

For detailed production environment variable configurations and database connection strings, refer to [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md).

---

## 📄 License & Credits

This project is licensed under the **MIT License**.  
Crafted with precision for modern restaurant operators seeking high reliability, lightning-fast ordering, and complete freedom from aggregator commissions.
