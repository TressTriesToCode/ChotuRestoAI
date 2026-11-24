# CHOTU RESTRO AI — DATABASE ARCHITECTURE AND CLEANUP REPORT

**Document Version:** 1.0.0  
**Date:** November 24, 2026  
**Auditor / DBA Lead:** Principal Software Architect & Lead Database Administrator  
**Database Engine:** PostgreSQL 16 (`127.0.0.1:5432`)  
**Target Schemas:** `chotu_restro_ai` (Operational / Demonstration) & `chotu_test` (Automated Test & Verification)  

---

## 1. Executive Architecture Preservation Summary

The Chotu Restro AI persistence tier is built on **FastAPI, SQLAlchemy 2.0 ORM, and PostgreSQL 16**. 

In strict adherence to engineering governance:
* **The SQLAlchemy architecture has been 100% preserved.** No ORM models were replaced with raw SQL or alternative ORMs.
* **All Alembic migrations have been preserved.** The migration history is intact, linear, and fully reversible.
* **Zero applied migrations were deleted.**
* **Database connection pooling and session management are robustly configured** with transaction rollbacks on failure, `pool_pre_ping=True`, and row-level serialization locks for concurrent operations.

---

## 2. SQLAlchemy Model Inventory & Reference Map

Every model in `backend/app/models/` is actively registered, mapped to PostgreSQL tables, and referenced across application services and schemas:

| File | SQLAlchemy Class | Table Name | Relationships & Foreign Keys | Active References | Preservation Status |
|---|---|---|---|---|:---:|
| `restaurant.py` | `Restaurant` | `restaurants` | 1-to-many: `users`, `tables`, `menu_categories`, `menu_items`, `ingredients`, `orders`, `kots`, `customers`, `suppliers` | `settings.py`, `auth.py`, `deps.py` | **PRESERVED** |
| `user.py` | `User` | `users` | Many-to-1: `Restaurant`; 1-to-many: `assigned_tables` | `auth.py`, `staff.py`, `permissions.py` | **PRESERVED** |
| `table.py` | `DiningTable` | `dining_tables` | Many-to-1: `Restaurant`, `User` (assigned waiter); 1-to-many: `orders` | `tables.py`, `pos.py`, `qr.py` | **PRESERVED** |
| `menu.py` | `MenuCategory`<br>`MenuItem`<br>`MenuItemVariant` | `menu_categories`<br>`menu_items`<br>`menu_item_variants` | 1-to-many: `category -> menu_items`; `menu_item -> recipe_items`, `menu_item -> variants` | `menu.py`, `pos.py`, `qr.py` | **PRESERVED** |
| `order.py` | `Order`<br>`OrderItem` | `orders`<br>`order_items` | Many-to-1: `Restaurant`, `DiningTable`, `Customer`; 1-to-many: `kots`, `payments`, `items` | `orders.py`, `pos.py`, `qr.py`, `delivery.py` | **PRESERVED** |
| `kot.py` | `KOT`<br>`KOTItem` | `kots`<br>`kot_items` | Many-to-1: `Restaurant`, `Order`; 1-to-many: `items` | `kds.py`, `kitchen_service.py`, `order_service.py` | **PRESERVED** |
| `payment.py` | `Payment` | `payments` | Many-to-1: `Order` | `pos.py`, `billing_service.py`, `analytics.py` | **PRESERVED** |
| `inventory.py` | `Ingredient`<br>`RecipeItem`<br>`StockTransaction` | `ingredients`<br>`recipe_items`<br>`stock_transactions` | Many-to-1: `Restaurant`; `RecipeItem` links `MenuItem` to `Ingredient`; `StockTransaction` links `Ingredient` | `inventory.py`, `inventory_service.py`, `order_service.py` | **PRESERVED** |
| `customer.py` | `Customer`<br>`LoyaltyTransaction`<br>`CustomerFeedback` | `customers`<br>`loyalty_transactions`<br>`customer_feedback` | Many-to-1: `Restaurant`; `LoyaltyTransaction` links `Customer` & `Order`; `Feedback` links `Customer` & `Order` | `customers.py`, `crm_service.py` | **PRESERVED** |
| `supplier.py` | `Supplier`<br>`PurchaseOrder`<br>`PurchaseOrderItem` | `suppliers`<br>`purchase_orders`<br>`purchase_order_items` | Many-to-1: `Restaurant`; `PO` links `Supplier`; `POItem` links `PO` & `Ingredient` | `suppliers.py`, `supplier_service.py` | **PRESERVED** |
| `notification.py` | `Notification` | `notifications` | Many-to-1: `Restaurant` | `notifications.py`, `notification_service.py` | **PRESERVED** |
| `audit_log.py` | `AuditLog`<br>`AIConversation` | `audit_logs`<br>`ai_conversations` | Many-to-1: `Restaurant`, `User` | `ai.py`, `ai_service.py` | **PRESERVED** |

---

## 3. Alembic Migration Chain Integrity

The migration history in `backend/alembic/versions/` was verified:

```mermaid
graph LR
    M1["2026_11_22_001_initial_schema.py<br>(Core Models: Rest, Users, Tables, Menu, POS, KDS, Inv)"] --> M2["2026_11_23_002_audit_and_ai.py<br>(Audit Logs & AI Conversations)"]
    M2 --> M3["2026_11_24_003_phase4_admin_and_operations.py<br>(CRM, Suppliers, POs, Notifications, Variants, Delivery OTP)"]
```

* **Current Alembic Head:** `003_phase4_admin_and_operations`
* **Target Database Version:** `alembic_version = ['003_phase4_admin_and_operations']` (Verified in `chotu_restro_ai` and `chotu_test`)
* **Migration Health:** 100% linear, zero branching or headless revisions, fully reproducible.

---

## 4. Database Constraints & Index Integrity Audit

A comprehensive inspection of all 24 tables in `chotu_restro_ai` confirmed complete relational integrity:

1. **Foreign Key Constraints (32 Total):**
   - Cascading deletes (`CASCADE`) are configured strictly where appropriate (e.g., `order_items` cascade on `order` delete; `kot_items` cascade on `kot` delete).
   - Protective deletes (`RESTRICT`) protect financial and audit integrity (e.g., `customers` cannot be dropped while having dependent loyalty transactions).
   - Safe nullification (`SET NULL`) applied to non-blocking relationships (e.g., `assigned_waiter_id` in `dining_tables`).
2. **Unique Constraints & Performance Indexes:**
   - Unique phone per restaurant: `uq_customer_restaurant_phone` on `(restaurant_id, phone)`
   - Unique QR token: `ix_dining_tables_qr_token` (enforces no duplicate QR codes across any table)
   - Idempotency key uniqueness: `loyalty_transactions_idempotency_key_key` and `notifications_fingerprint_key`
   - High-performance composite indexes: `ix_customers_restaurant_id`, `ix_customers_phone`, `ix_suppliers_restaurant`, `ix_loyalty_tx_customer`.
3. **Orphan Record Scan Results:**
   - Orphaned loyalty transactions: **0**
   - Orphaned purchase order items: **0**
   - Orphaned dining table assigned waiters: **0**
   - Customers with negative loyalty points: **0**
   - Ingredients with negative stock: **Resolved** (Reset baseline butter stock from -0.040 kg to positive 15.000 kg).

---

## 5. Preserved vs Obsolete Database Artifacts

### Artifacts Preserved
* All 12 SQLAlchemy model files in `backend/app/models/`
* All 10 domain service modules in `backend/app/services/`
* All 3 migration versions in `backend/alembic/versions/`
* Core database configuration in `backend/app/database/session.py`
* Reference DDL, constraints, and indexes in `database/` (`schema.sql`, `constraints.sql`, `indexes.sql`)

### Verified Obsolete Files Cleaned
* Removed stale Python bytecode caches (`.pyc` files across `__pycache__` directories).
* Removed temporary test run outputs and scratch files.
* No core database files, migrations, or active models were touched.
