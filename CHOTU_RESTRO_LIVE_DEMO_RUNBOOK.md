# CHOTU RESTRO AI — LIVE RESTAURANT DEMONSTRATION RUNBOOK

**Document Version:** 1.0.0  
**Target Audience:** Restaurant Owners, General Managers, Investors & Live Trial Evaluators  
**Demonstration Restaurant:** The Spice Junction, Bandra West, Mumbai (`SPICE-JCT`)  
**Currency:** Indian Rupee (INR — ₹)  
**Taxes & Charges:** CGST (2.5%), SGST (2.5%), Service Charge (5.0%)  

---

## Pre-Demonstration Credentials Checklist

| Role | User Account Email | Password | Primary Screen |
|---|---|---|---|
| **Owner** | `owner@spicejunction.in` | `Chotu@123` | Executive Cockpit (`/dashboard`), Settings (`/settings`) |
| **Manager** | `manager@spicejunction.in` | `Chotu@123` | Table Cards (`/qr/codes`), Menu (`/menu`), Staff (`/staff`) |
| **Cashier** | `cashier@spicejunction.in` | `Chotu@123` | POS Terminal (`/pos`), Orders (`/orders`) |
| **Kitchen Chef** | `chef@spicejunction.in` | `Chotu@123` | Kitchen Display System (`/kds`) |
| **Waiter** | `waiter@spicejunction.in` | `Chotu@123` | Floor & Tables (`/tables`) |
| **Guest Customer** | *No login required* | *Public QR Token* | Customer Menu (`/qr/{tableId}?token=...`) |

---

## 20-Step Live Restaurant Demonstration Protocol

### Step 1: Owner Authentication
* **Action:** Navigate to `http://localhost:3000/login`. Enter email `owner@spicejunction.in` and password `Chotu@123`. Click "Sign In".
* **Expected Result:** Immediate redirection to the Restaurant Control Center (`/dashboard`). Header displays "The Spice Junction • Bandra West", Owner badge, and active operational stats.
* **API Involved:** `POST /api/v1/auth/login`
* **Database State:** Session JWT validated; User role verified as `OWNER`.
* **Evidence:** HTTP 200 response with Bearer token.

### Step 2: Restaurant Profile & Tax Compliance Verification
* **Action:** Click "Settings & Profile" (`/settings`).
* **Expected Result:** Form pre-populates with official legal details: GSTIN (`27AABCT3518Q1ZP`), FSSAI (`11521001000452`), CGST 2.5%, SGST 2.5%, Service Charge 5.0%, and UPI VPA (`thespicejunction@icici`).
* **API Involved:** `GET /api/v1/settings`
* **Evidence:** All values originate from `restaurants` table row `rest-spice-jct`.

### Step 3: Staff Roster & Role-Based Permissions
* **Action:** Click "Staff & Shifts" (`/staff`).
* **Expected Result:** Clean staff directory displaying the 5 restaurant roles (Owner, Manager, Cashier, Chef, Waiter) with active status badges.
* **API Involved:** `GET /api/v1/staff`
* **Evidence:** `users` table returns active accounts for `rest-spice-jct`.

### Step 4: Menu Catalog & Pricing Inspection
* **Action:** Click "Menu & Pricing" (`/menu`).
* **Expected Result:** 10 authentic items across 5 categories (Mains, Breads, Starters, Desserts, Beverages) with prices (e.g. Butter Chicken ₹340, Garlic Naan ₹60, Dum Biryani ₹390), veg/non-veg markers, and station tags.
* **API Involved:** `GET /api/v1/menu/items`
* **Evidence:** Data queried directly from `menu_items` table.

### Step 5: Floor Status & Table Initialization
* **Action:** Click "Floor & Tables" (`/tables`).
* **Expected Result:** 8 tables (`T-01` to `T-08`) displayed in grid format. All tables show **VACANT** status with ₹0.00 current bill.
* **API Involved:** `GET /api/v1/tables`
* **Evidence:** `dining_tables` rows show `status = 'VACANT'` and `current_order_id = NULL`.

### Step 6: QR Code Management & Scannable Table Card
* **Action:** Click "QR Codes & Table Cards" (`/qr/codes`). Locate Table T-01 card.
* **Expected Result:** Table T-01 displays unique, high-contrast QR code, verified URL (`http://localhost:3000/qr/T-01?token=chotu_qr_...`), "Preview Customer Menu", "Download QR", and "Print Table Card" actions.
* **API Involved:** `GET /api/v1/tables`
* **Evidence:** QR payload contains 256-bit secure token generated via `secrets.token_urlsafe(32)`.

### Step 7: Customer Opens Dynamic Table Menu
* **Action:** Click "Preview Customer Menu" on Table T-01 or scan QR code on a mobile device.
* **Expected Result:** Opens customer mobile menu `/qr/T-01?token=...`. Banner shows "The Spice Junction • Table T-01". Category pills (All, Mains, Breads, Starters, Desserts, Beverages) allow quick navigation.
* **API Involved:** `GET /api/v1/qr/{token}/table` and `GET /api/v1/qr/{token}/menu`
* **Evidence:** Constant-time token digest validation (`secrets.compare_digest`) validates Table T-01 without exposing secrets.

### Step 8: Customer Places QR Order
* **Action:** In the customer menu, click "+" on **Butter Chicken (Boneless)** (₹340) and "+" on **Garlic Butter Naan** (₹60, quantity 2). Bottom bar updates to "3 Items • ₹460". Click "Review Order" -> Click "Place Order".
* **Expected Result:** Spinner displays briefly, followed by instant transition to "Order Confirmed!" with real-time status tracker (Placed -> Preparing -> Ready).
* **API Involved:** `POST /api/v1/qr/{token}/orders` with `idempotency_key`
* **Database State:** `orders` row created with `subtotal = 460.00`, `table_id = 'T-01'`, `placed_by = 'QR'`. `dining_tables` row for `T-01` transitions to `OCCUPIED`.

### Step 9: Real-Time POS Terminal Synchronization
* **Action:** Switch to cashier/manager tab at `/pos`.
* **Expected Result:** Table T-01 tile immediately flips to **OCCUPIED (Amber)** with active bill ₹506.00. Clicking Table T-01 loads the cart with Butter Chicken (1) and Garlic Butter Naan (2).
* **API Involved:** Live WebSocket event `TABLE_UPDATED` & `GET /api/v1/pos/orders/{id}`
* **Evidence:** `dining_tables.current_order_id` matches newly created order ID.

### Step 10: Automatic KOT Generation & Kitchen Routing
* **Action:** Check backend logs or kitchen tickets table.
* **Expected Result:** KOT Ticket #1001 automatically fired with station routing:
  - Station CURRY: Butter Chicken (1)
  - Station TANDOOR: Garlic Butter Naan (2)
* **API Involved:** `OrderService.fire_kot` called atomically during order submission.
* **Database State:** `kots` row created with `kot_number = 1001`, `status = 'COOKING'`.

### Step 11: Kitchen Display System (KDS) Live Execution
* **Action:** Switch to chef view at `/kds`.
* **Expected Result:** Ticket #1001 appears with glowing header "Table T-01 • KOT #1001", timer elapsed count, and item checklist.
* **API Involved:** `GET /api/v1/kds/tickets?status=active`
* **Evidence:** Live WebSocket synchronization renders ticket without browser refresh.

### Step 12: Kitchen Prepares & Bumps Ticket
* **Action:** In `/kds`, chef clicks checkbox on "Garlic Butter Naan" (marks prepared), then clicks the green **"Bump Ticket"** button.
* **Expected Result:** Ticket animates out of the active screen. Ticket status updates to `BUMPED`.
* **API Involved:** `POST /api/v1/kds/tickets/{id}/bump`
* **Database State:** `kot.status = 'BUMPED'`, `order.status = 'READY'`.

### Step 13: Customer Sees Order Progress
* **Action:** Look at customer mobile screen at `/qr/T-01`.
* **Expected Result:** Status tracker updates to **"Food is Ready! Your server is bringing your hot meal."**
* **Evidence:** WebSocket synchronization or polling reflects order status `READY`.

### Step 14: Multi-Table Isolation Demonstration
* **Action:** Open Table T-02 QR menu in an incognito window (`/qr/T-02?token=...`). Add **Hyderabadi Dum Gosht Biryani** (₹390) and submit order.
* **Expected Result:** Table T-02 creates Order #2 and KOT #1002. In POS, Table T-01 (₹506) and Table T-02 (₹429) remain strictly isolated on the floor map.
* **Evidence:** `dining_tables` shows T-01 and T-02 each holding separate `current_order_id` values.

### Step 15: Out-of-Stock Real-Time Prevention
* **Action:** In `/menu`, toggle "In Stock" OFF for **Paneer Tikka Masala**. Return to customer QR menu.
* **Expected Result:** Paneer Tikka Masala card dims with "Out of Stock" badge. Clicking Add to Cart is disabled. Attempting a direct API POST returns **HTTP 400 Bad Request ("Item is currently out of stock")**.
* **API Involved:** `PATCH /api/v1/menu/items/{id}/stock` and `POST /api/v1/qr/{token}/orders`
* **Evidence:** Server-side validation rejects out-of-stock items authoritatively.

### Step 16: Accurate Bill Calculation Review
* **Action:** In POS (`/pos`), select Table T-01. Click "Review Bill".
* **Expected Result:** Itemized tax invoice breakdown:
  - Subtotal: **₹460.00**
  - CGST (2.5%): **₹11.50**
  - SGST (2.5%): **₹11.50**
  - Service Charge (5.0%): **₹23.00**
  - Round Off / Total: **₹506.00**
* **API Involved:** `billing_service.calculate_bill`
* **Evidence:** Exact mathematical match; zero simulated figures.

### Step 17: Payment Settlement & Table Release
* **Action:** Select Payment Method **UPI**. Click **"Settle & Close Bill"**.
* **Expected Result:** Payment confirmed message. Table T-01 tile immediately flips from OCCUPIED to **VACANT (Emerald Green)** with ₹0.00 bill.
* **API Involved:** `POST /api/v1/pos/orders/{id}/settle`
* **Database State:** `orders.payment_status = 'PAID'`, `orders.status = 'COMPLETED'`, `dining_tables.status = 'VACANT'`, `dining_tables.current_order_id = NULL`.

### Step 18: Real-Time Recipe Inventory Consumption
* **Action:** Click "Inventory & Stock" (`/inventory`).
* **Expected Result:** Stock balances have decreased by exact recipe requirements:
  - Boneless Fresh Chicken: Decreased by 250g (from 20.000 kg to 19.750 kg).
  - Heavy Dairy Cream & Butter: Decreased by 120g (80g Butter Chicken + 40g 2x Naan).
  - Premium Sharbati Maida: Decreased by 240g (120g x 2 Naan).
  - "Recent Stock Movements" shows negative consumption transactions linked to Order ID.
* **API Involved:** `GET /api/v1/inventory/ingredients` and `GET /api/v1/inventory/transactions`
* **Evidence:** `stock_transactions` table records matching entries.

### Step 19: Customer Loyalty Points Awarded
* **Action:** Click "Customer CRM" (`/customers`). Look up customer or phone used during POS order.
* **Expected Result:** Total spend shows ₹506.00. Loyalty points balance increased by 5 points (awarded at 1 point per ₹100 spent).
* **API Involved:** `GET /api/v1/customers`
* **Database State:** `loyalty_transactions` record inserted with `transaction_type = 'EARN'`.

### Step 20: Operational Analytics & Chotu AI Assistant Query
* **Action 1 (Analytics):** Click "Reports & Z-Report" (`/analytics`). Total revenue displays today's net sales (**₹460.00**) plus tax breakdown (CGST ₹11.50, SGST ₹11.50, SC ₹23.00). Top selling dishes list Butter Chicken and Garlic Naan.
* **Action 2 (Chotu AI):** Click "Ask Chotu AI" in the bottom bar. Type: *"What are today's total sales and how many tables are occupied?"*
* **Expected Result:** Chotu AI responds with live database facts:
  > *"Today's net sales are ₹460.00 (Gross: ₹506.00 across 1 settled order). Currently, Table T-02 is occupied with an active order of ₹429.00, while 7 tables are vacant."*
* **API Involved:** `POST /api/v1/ai/query`
* **Evidence:** Chotu AI queries live PostgreSQL records with zero hallucination.

---

## 3. Boundary Notes for Evaluators

1. **In-House vs External Delivery:** In-house rider dispatch with cryptographic OTP verification is 100% functional. Automated ingestion of Zomato/Swiggy aggregator webhooks requires active restaurant partner API credentials.
2. **AI Voice Mode:** Text chat assistant is 100% operational. Native bidirectional audio streaming requires a connected Google Gemini Multimodal Live API key.
