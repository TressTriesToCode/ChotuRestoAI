# Chotu Restro AI — Feature Implementation Matrix

**Last Updated:** November 23, 2026  
**Status Key:**
- `WORKING`: Fully implemented, connects to real backend, tested and verified.
- `PARTIAL`: Partially implemented with backend logic, but missing some UI options or advanced workflows.
- `UI ONLY`: Visual component exists, but does not persist to backend.
- `MOCK DATA`: Relies on static client mock arrays.
- `NOT IMPLEMENTED`: Feature is completely missing.
- `BROKEN`: Component or endpoint errors.

**Priority Key:**
- `P0`: Critical core operational capability (Blocks primary restaurant workflows).
- `P1`: Essential production capability (Needed for commercial day-to-day operations).
- `P2`: Value-add / Intelligence / Enterprise scaling capability.

---

| # | Feature Name | Module | Frontend Route / Component | Backend Endpoint | DB Tables | Current Status | Missing Functionality / Gap | Priority |
|---|--------------|--------|----------------------------|------------------|-----------|----------------|------------------------------|----------|
| 1 | Public Brand Showcase & Conversion | Landing Page | `/landing`, `LandingPage.tsx` | N/A (Static SSG) | N/A | `WORKING` | None (Protected from any edits) | P0 |
| 2 | Staff Login & Authentication | Auth | `/login` | `POST /api/v1/auth/login`, `GET /api/v1/auth/me` | `users`, `roles`, `staff_profiles` | `PARTIAL` | Backend JWT exists; frontend lacks login UI, token persistence & route guards | P0 |
| 3 | Modern SaaS Navigation & Shell | Navigation | `(dashboard)/layout.tsx`, `Sidebar.tsx` | N/A | N/A | `NOT IMPLEMENTED` | Currently single-page tab switcher; needs sidebar shell & App Router layout | P0 |
| 4 | Executive KPI Cockpit | Dashboard | `/dashboard` | `GET /api/v1/analytics/overview` | `orders`, `dining_tables`, `payments` | `UI ONLY` | Needs dedicated executive dashboard with live sales, open tables, active orders | P0 |
| 5 | Table Grid & Status Visualizer | Floor Management | `/tables` | `GET /api/v1/tables`, `PUT /api/v1/tables/{id}/status` | `dining_tables`, `table_qr_tokens` | `PARTIAL` | Strip in POS; needs dedicated floor grid with sections (AC, Rooftop, Bar) | P0 |
| 6 | POS Item Ordering & Ledger | POS | `/pos` | `POST /api/v1/pos/order/{table_id}/item` | `orders`, `order_items`, `menu_items` | `WORKING` | Missing item variant selection and custom cooking notes in UI | P0 |
| 7 | Digital KOT Transmission | POS & Kitchen | `/pos`, `KitchenDisplay.tsx` | `POST /api/v1/pos/order/{table_id}/fire-kot` | `kot_tickets`, `kot_items`, `recipes`, `ingredients` | `WORKING` | Missing kitchen station routing selection in POS | P0 |
| 8 | Multi-Tender Bill Settlement | POS & Billing | `/pos` | `POST /api/v1/pos/order/{table_id}/settle` | `payments`, `orders`, `dining_tables` | `WORKING` | Missing split billing and customer tip logging in UI | P0 |
| 9 | Printable Receipt / Invoice View | POS & Billing | `/pos` | `GET /api/v1/orders/{id}/invoice` | `invoices`, `payments`, `orders` | `PARTIAL` | Simulated alert; needs standard printable modal with GSTIN, items & UPI QR | P0 |
| 10 | Central Live Orders Dispatch | Orders Hub | `/orders` | `GET /api/v1/orders`, `PUT /api/v1/orders/{id}/status` | `orders`, `order_items`, `customers` | `PARTIAL` | Relies on mixed mock state; needs full API sync, filters & order details drawer | P0 |
| 11 | KDS Live Ticket Wall | Kitchen Display | `/kds` | `GET /api/v1/kds/tickets`, `POST /api/v1/kds/bump/{id}` | `kot_tickets`, `kot_items` | `WORKING` | Multi-station filtering (Tandoor, Curry, Bar) needs frontend tabs | P0 |
| 12 | Customer QR Digital Menu | QR Ordering | `/qr/[tableId]`, `CustomerMenu.tsx` | `GET /api/v1/qr/{table_id}/menu` | `menu_items`, `menu_categories` | `WORKING` | Needs URL route parameter support (`/qr/[tableId]`) for direct QR code scanning | P0 |
| 13 | Customer Self-Order Placement | QR Ordering | `/qr/[tableId]` | `POST /api/v1/qr/{table_id}/order` | `orders`, `order_items`, `kot_tickets` | `WORKING` | Auto-fires KOT and deducts stock; needs real-time customer status timeline | P0 |
| 14 | Waiter Call & Assistance | QR Ordering | `/qr/[tableId]` | `POST /api/v1/qr/{table_id}/call-waiter` | `notifications`, `dining_tables` | `NOT IMPLEMENTED` | UI button exists; needs backend notification endpoint & floor visual indicator | P1 |
| 15 | QR Code Generator & Print Sheets | QR Admin | `/qr/codes` | `GET /api/v1/tables/qr-codes` | `table_qr_tokens`, `dining_tables` | `NOT IMPLEMENTED` | Table QR generation with downloadable SVG/PDF print cards | P1 |
| 16 | Delivery & Aggregator Orders | Delivery | `/delivery` | `GET /api/v1/delivery/orders`, `POST /api/v1/delivery/dispatch` | `orders`, `customers` | `MOCK DATA` | Needs dedicated delivery dashboard with rider assignment and status dispatch | P1 |
| 17 | Self-Ordering Kiosk Screen | Kiosk | `/kiosk` | `POST /api/v1/kiosk/order` | `orders`, `order_items`, `menu_items` | `NOT IMPLEMENTED` | Dedicated touch-friendly kiosk UI for counter self-ordering with token printing | P1 |
| 18 | Raw Material Stock Management | Inventory | `/inventory` | `GET /api/v1/inventory`, `POST /api/v1/inventory/{id}/adjust` | `ingredients`, `inventory_transactions` | `WORKING` | Missing Waste/Spoilage logging modal and minimum reorder point triggers | P0 |
| 19 | Recipe Engine & Auto-Depletion | Inventory | `/inventory/recipes` | `GET /api/v1/inventory/recipes`, `POST /api/v1/inventory/recipes` | `recipes`, `recipe_ingredients` | `PARTIAL` | Backend depletions work on KOT; needs interactive recipe builder UI | P1 |
| 20 | Purchase Orders & Suppliers | Inventory | `/inventory/purchase-orders` | `GET /api/v1/inventory/suppliers`, `POST /api/v1/inventory/po` | `suppliers`, `purchase_orders` | `NOT IMPLEMENTED` | Supplier directory and purchase order creation workflow | P2 |
| 21 | Menu & Price Management | Menu | `/menu` | `GET /api/v1/menu`, `POST /api/v1/menu/items`, `PUT /api/v1/menu/items/{id}` | `menu_items`, `menu_categories` | `PARTIAL` | Backend CRUD exists; needs full management UI with category tabs, 86'd toggle | P0 |
| 22 | Chotu AI Voice & Natural Language | AI Assistant | Floating Drawer & `/ai` | `POST /api/v1/ai/query`, `POST /api/v1/ai/action` | `ai_conversations`, `business_audit_logs` | `WORKING` | Conversational engine handles 15+ intents; needs audio feedback & action modals | P1 |
| 23 | Operational Daily Briefing | AI Insights | `/insights` | `GET /api/v1/ai/daily-briefing` | `daily_business_summaries`, `orders` | `PARTIAL` | UI displays insights; needs real dynamic generator for peak hours & food cost alerts | P1 |
| 24 | Sales & Revenue Reports | Analytics | `/analytics` | `GET /api/v1/analytics/overview`, `/hourly`, `/top-dishes` | `orders`, `payments`, `order_items` | `WORKING` | Needs date-range picker and CSV download export | P0 |
| 25 | End-of-Day Z-Report | Analytics | `/analytics/z-report` | `GET /api/v1/analytics/z-report` | `payments`, `expenses`, `orders` | `NOT IMPLEMENTED` | Cash reconciliation, tax collected breakdown, payment mode totals | P1 |
| 26 | Customer Directory & Loyalty | CRM | `/customers` | `GET /api/v1/customers`, `POST /api/v1/customers` | `customers`, `orders` | `NOT IMPLEMENTED` | Customer list with total visits, lifetime spend, loyalty points & order history | P1 |
| 27 | Marketing & Promo Codes | Marketing | `/marketing` | `GET /api/v1/marketing/coupons`, `POST /api/v1/marketing/coupons` | `coupons`, `campaigns` | `NOT IMPLEMENTED` | Discount coupon management with usage limits and discount types (Flat / %) | P2 |
| 28 | Staff Directory & Shifts | Staff | `/staff` | `GET /api/v1/staff`, `POST /api/v1/staff` | `users`, `staff_profiles`, `roles` | `PARTIAL` | Backend users exist; needs staff list, role assignment, and shift records | P1 |
| 29 | Petty Cash & Expense Logging | Expenses | `/expenses` | `GET /api/v1/expenses`, `POST /api/v1/expenses` | `expenses` | `NOT IMPLEMENTED` | Cash drawer tracker, daily expense logging (dairy, vegetables, maintenance) | P1 |
| 30 | Restaurant Profile & Tax Config | Settings | `/settings` | `GET /api/v1/settings`, `PUT /api/v1/settings` | `restaurants`, `restaurant_settings` | `PARTIAL` | DB has settings; needs UI to configure GSTIN, FSSAI, Tax %, Service charge, UPI VPA | P0 |
| 31 | WebSocket Real-Time Bus | Real-Time Sync | `src/lib/api/websocket.ts` | `/ws/{restaurant_id}` | In-memory broadcast | `WORKING` | Broadcasts `ORDER_CREATED`, `KOT_CREATED`, `KOT_UPDATED`, `TABLE_UPDATED` | P0 |
