# Chotu Restro AI — Comprehensive Project Audit (Phase 0)

**Date of Audit:** November 23, 2026  
**Auditor:** Principal Software Architect, Senior Full-Stack Engineer, POS Product Designer  
**Scope:** Complete repository inspection, architecture mapping, code evaluation, and baseline documentation  
**Reference Benchmark:** RestroBomb POS workflows, 12-page Chotu Restro AI Architectural Walkthrough, and production hospitality standards  

---

## 1. Executive Summary

This audit assesses the exact current state of the **Chotu Restro AI** repository. It serves as the baseline for the non-destructive enhancement and redesign mandated by the Master Prompt.

### Core Architectural Findings:
1. **Frontend Foundation:** Next.js 15.5 with React 19 and Tailwind CSS. The design system uses Warm Espresso (`#1E1B18`) and Burnt Terracotta (`#D95D39`), with custom semantic design tokens (`canvas`, `ink`, `primary`, `border`, `dietary`) and typography tokens (Schibsted Grotesk, Space Mono, Caveat).
2. **Landing Page Protection:** The public showcase page (`src/components/landing/LandingPage.tsx` and `src/app/landing/page.tsx`) with 3D elevation topography and 9 canvas animations is fully functional, isolated, and strictly preserved.
3. **App Router Routing:** 24 routes exist across authenticated dashboard modules (`/dashboard`, `/pos`, `/tables`, `/orders`, `/kds`, `/delivery`, `/kiosk`, `/menu`, `/inventory`, `/customers`, `/staff`, `/expenses`, `/ai`, `/insights`, `/analytics`, `/marketing`, `/settings`, `/qr/codes`), customer-facing routes (`/qr/[tableId]`), and auth (`/login`).
4. **Backend Architecture:** High-performance asynchronous FastAPI backend running on Python 3.12 with SQLAlchemy 2.x ORM, Alembic migrations, psycopg 3 PostgreSQL driver, and SQLite local fallback.
5. **Business Logic & Persistence:** Orders, billing, kitchen tickets, table occupancy, and raw ingredient depletions are centralized in `order_service.py`, `billing_service.py`, `kitchen_service.py`, and `inventory_service.py` with Python `Decimal` rounding half-up financial precision.

---

## 2. Repository Inventory & File Structure

```
c:\restro ai\choturestoai\
├── src\
│   ├── app\
│   │   ├── (auth)\login\page.tsx          # Staff login with quick demo roles
│   │   ├── (dashboard)\layout.tsx         # Persistent sidebar & topbar shell
│   │   ├── (dashboard)\dashboard\page.tsx # Operations Command Center
│   │   ├── (dashboard)\pos\page.tsx       # POS Terminal & Billing workspace
│   │   ├── (dashboard)\tables\page.tsx    # Floor map & table grid
│   │   ├── (dashboard)\orders\page.tsx    # Multi-channel orders dispatch hub
│   │   ├── (dashboard)\kds\page.tsx       # Kitchen Display System
│   │   ├── (dashboard)\delivery\page.tsx  # Delivery fleet & aggregator management
│   │   ├── (dashboard)\menu\page.tsx      # Culinary catalog & price management
│   │   ├── (dashboard)\inventory\page.tsx # Raw stock ledger & recipe mapping
│   │   ├── (dashboard)\customers\page.tsx # Guest CRM & loyalty tracking
│   │   ├── (dashboard)\staff\page.tsx     # Staff roster & shift management
│   │   ├── (dashboard)\expenses\page.tsx  # Petty cash & expense register
│   │   ├── (dashboard)\ai\page.tsx        # Chotu AI conversational console
│   │   ├── (dashboard)\insights\page.tsx  # Economics & operational pulse
│   │   ├── (dashboard)\analytics\page.tsx # Revenue reports & Z-report
│   │   ├── (dashboard)\marketing\page.tsx # Promos, coupons & WhatsApp campaigns
│   │   ├── (dashboard)\qr\codes\page.tsx  # Table QR card generator
│   │   ├── (dashboard)\settings\page.tsx  # GSTIN, FSSAI, tax & UPI configuration
│   │   ├── kiosk\page.tsx                 # Express counter self-ordering kiosk
│   │   ├── qr\[tableId]\page.tsx          # Customer mobile-first QR menu
│   │   ├── landing\page.tsx               # Public landing page (PROTECTED)
│   │   ├── layout.tsx                     # Root layout with AuthProvider
│   │   ├── globals.css                    # Theme variables & typography
│   │   └── page.tsx                       # Smart redirect to /dashboard
│   ├── components\
│   │   ├── animations\                    # 9 Canvas / WebGL animation primitives
│   │   ├── layout\                        # Sidebar, TopBar, PageHeader
│   │   ├── ui\                            # StatCard, Modal, primitives
│   │   ├── pos\PosTerminal.tsx            # Cashier workspace
│   │   ├── kds\KitchenDisplay.tsx         # Station routing display
│   │   ├── qr\CustomerMenu.tsx            # Guest ordering drawer
│   │   ├── orders\LiveOrdersHub.tsx       # Dispatch ledger
│   │   ├── inventory\InventoryHub.tsx     # Stock management
│   │   ├── ai\IntelligenceHub.tsx         # Economics dashboard
│   │   ├── voice\ChotuVoiceModal.tsx      # Voice AI assistant modal
│   │   └── landing\LandingPage.tsx        # Protected public showcase
│   ├── lib\
│   │   ├── api\                           # Typed API clients (pos, tables, kds, qr, etc.)
│   │   └── context\AuthContext.tsx        # Session state & JWT handling
│   ├── types\restaurant.ts                # TypeScript domain models
│   └── data\mockData.ts                   # Initial benchmark dataset
├── backend\
│   ├── app\
│   │   ├── api\v1\                        # FastAPI REST routers (auth, pos, kds, qr, etc.)
│   │   ├── core\                          # Security (bcrypt, JWT), permissions, config
│   │   ├── database\                      # SQLAlchemy session & base
│   │   ├── models\                        # 9 SQLAlchemy ORM models
│   │   ├── schemas\                       # Pydantic v2 validation models
│   │   ├── services\                      # Order, Billing, Kitchen, Inventory, AI services
│   │   ├── websocket\                     # Real-time WebSocket event broadcaster
│   │   ├── initial_data.py                # Database seeder (Spice Junction demo)
│   │   └── main.py                        # FastAPI application entrypoint
│   ├── tests\                             # 9 test files (13 pytest test cases)
│   └── alembic\                           # Database migration scripts
├── database\                              # Raw PostgreSQL SQL scripts
│   ├── schema.sql                         # 33 relational tables
│   ├── indexes.sql                        # High-performance btree & gin indexes
│   ├── constraints.sql                    # Foreign keys & check constraints
│   └── seed.sql                           # Production demo dataset
└── docs\                                  # Project documentation
```

---

## 3. Operational Flow Audit

### 3.1 Ordering & Kitchen Dispatch Lifecycle
1. **POS Order Initiation:** Cashier selects table (`T-04`), adds items (e.g. Butter Chicken, Garlic Naan).
2. **KOT Transmission:** Cashier clicks "Fire KOT". `OrderService` validates items, calculates subtotal and taxes via `BillingService`, generates ticket `#KOT-1042`, and writes to `kot_tickets`.
3. **Recipe Stock Depletion:** `InventoryService` looks up recipe mapping (e.g. 250g Chicken, 60g Butter per portion) and deducts raw stock from `ingredients` table.
4. **KDS Real-Time Display:** Kitchen screen displays ticket under respective station tabs (Curry, Tandoor) with running prep timers and allergy warnings.
5. **Ticket Bump:** Kitchen chef marks items/ticket ready. Status updates to `ready`.
6. **Bill Settlement:** Cashier settles via UPI QR, Cash, or Card. `BillingService` verifies payment, records transaction in `payments` table, releases table to `vacant`, and generates printable tax invoice.

### 3.2 Customer QR Ordering Lifecycle
1. Customer scans table QR code (`/qr/T-04`).
2. Mobile-first menu loads with food images, dietary badges, and descriptions.
3. Customer adds items to cart and enters special instructions.
4. On placement, `POST /qr/{table_id}/order` writes directly to the **same central order service** as POS.
5. KOT is automatically fired, stock is depleted, and the ticket appears on KDS and POS simultaneously.

---

## 4. Current Gaps & Enhancement Opportunities

| Area | Current Baseline | Target Enhancement (RestroBomb Benchmark) |
|---|---|---|
| **Floor Plan** | Grid of table cards with occupancy timers. | Visual section floor plan with table merge, split, switch, and server reassignment. |
| **POS Customisations** | Custom cooking notes per item. | Structured variant selection (Half/Full), add-ons, and ingredient exclusions. |
| **Settlement** | Multi-tender modal (Cash, UPI QR, Card). | Cash denomination shortcuts (Exact, ₹50-round, ₹1000, ₹2000), change return, and item-wise bill splitting. |
| **Aggregator Integration** | Unified ledger with delivery tracking. | Live connection verification indicator distinguishing real aggregator webhooks from demo mode. |
| **KDS Alerts** | Color-coded SLA countdown timers. | Audible chime alerts on incoming tickets and overdue alert thresholds. |
| **Recipe Management** | Automated deduction engine. | Visual recipe builder interface linking raw materials to menu items with yield percentages. |
