# CHOTU RESTRO AI — BACKEND CODE CLEANUP & HARDENING REPORT

**Document Version:** 1.0.0  
**Date:** November 24, 2026  
**Auditor / Principal Architect:** Principal Software Architect & Head of Engineering  
**Target Backend:** FastAPI 0.115+ / Python 3.12 / PostgreSQL 16 (`backend/`)  

---

## 1. Executive Summary

A comprehensive architectural and code quality audit was performed across all 16 API routers, 10 domain services, 12 SQLAlchemy model modules, and core security utilities within `backend/app/`. 

All core backend workflows—order creation, billing calculations, inventory ledger transactions, KOT kitchen routing, customer CRM, and AI grounding—were verified to be **authoritative on the backend**, transaction-safe, and resilient against concurrent operations.

---

## 2. Hardened Architecture & Key Defect Remediations

### 1. Cryptographic QR Token Upgrade (256-Bit Entropy)
* **Location:** `backend/app/api/v1/tables.py` & `backend/app/api/v1/qr.py`
* **Defect:** Legacy tokens used 12 hexadecimal characters (`secrets.token_hex(6)`), providing only 48 bits of entropy.
* **Remediation:** Upgraded to `chotu_qr_{secrets.token_urlsafe(32)}` providing **256 bits of cryptographically secure randomness**.
* **Constant-Time Digest:** Implemented `secrets.compare_digest` in `get_table_by_token`, eliminating timing attack vectors.

### 2. Elimination of Order Creation Race Conditions (PostgreSQL Row Locks)
* **Location:** `backend/app/services/order_service.py` (`get_or_create_table_order`)
* **Defect:** Concurrent requests from multiple guests scanning the same table QR could simultaneously observe `table.current_order_id = None`, creating two duplicate active orders in PostgreSQL.
* **Remediation:** Added exclusive row-level serialization lock (`.with_for_update()`) on the `DiningTable` row. The first request establishes the order; subsequent concurrent requests safely append items to the active order session.

### 3. Sequential KOT Numbering Atomicity
* **Location:** `backend/app/services/order_service.py` (`fire_kot`)
* **Defect:** Rapid simultaneous KOT fires could read the same `last_kot.kot_number`, causing primary key collision or duplicate ticket numbers.
* **Remediation:** Enforced `.with_for_update()` lock on the latest KOT record query on PostgreSQL, guaranteeing strictly sequential ticket numbers (1001, 1002, 1003...).

### 4. Fix for Multi-Batch Inventory Double-Deduction
* **Location:** `backend/app/services/order_service.py` & `backend/app/api/v1/qr.py`
* **Defect:** In multi-batch dining scenarios (e.g. guests ordering starters first, then ordering main courses 20 minutes later), `fire_kot` fetched all items on the table order and passed them to `InventoryService.deduct_stock_for_order`. Consequently, ingredients for starters were deducted a second time.
* **Remediation:** Added `items_to_fire: Optional[List[Any]] = None` parameter to `OrderService.fire_kot`. In `qr.py`, tracked `newly_added_items` and passed strictly `items_to_fire=newly_added_items`. Previously ordered items are never re-deducted.

### 5. SQLAlchemy Un-Flushed Status Bug in KDS Bumping
* **Location:** `backend/app/services/kitchen_service.py` (`bump_kot`)
* **Defect:** When a chef bumped a KOT ticket, `kot.status = KOTStatus.BUMPED` was modified in Python memory, but `db.flush()` had not been executed prior to running `db.query(KOT).filter(...).count()`. Consequently, PostgreSQL evaluated the ticket as still active, preventing the order status from transitioning to `READY`.
* **Remediation:** Added explicit `db.flush()` immediately after status assignment so subsequent SQL queries in the same transaction evaluate committed state accurately.

### 6. WebSocket Information Leakage Prevention
* **Location:** `backend/app/api/v1/tables.py` (`regenerate_table_qr`)
* **Defect:** Plaintext QR tokens were being transmitted across WebSocket restaurant broadcasts.
* **Remediation:** Stripped the `qr_token` field from WebSocket broadcasts. Broadcasts now emit strictly non-sensitive event metadata: `{"table_id": table.id, "label": table.label, "status": table.status.value, "qr_regenerated": True}`.

### 7. RBAC Authorization Enforcement
* **Location:** `backend/app/api/v1/tables.py`
* **Defect:** Cashier role previously held `tables:*` permission in legacy matrix, permitting cashiers to invalidate active dining tokens mid-meal.
* **Remediation:** Enforced strict server-side check `current_user.role in [UserRole.OWNER, UserRole.MANAGER]`. Requests from Cashier, Waiter, and Kitchen staff immediately return **HTTP 403 Forbidden**. Unauthenticated requests return **HTTP 401 Unauthorized**.

### 8. Hardening of `init_demo_db` Seed Function
* **Location:** `backend/app/initial_data.py`
* **Defect:** `init_demo_db` contained hardcoded fake orders (`ord-demo-t04`, `ord-demo-002`, etc.), dummy rider names, fake KOTs, and hardcoded `T-04` as OCCUPIED.
* **Remediation:** Sanitized `init_demo_db` to seed strictly genuine operational baseline data:
  - Authorized Owner (`owner@spicejunction.in`), Manager, Cashier, Chef, Waiter.
  - 8 clean `VACANT` tables with 256-bit secure QR tokens.
  - 5 categories, 10 authentic dishes, 7 ingredients with realistic positive stock (10–50 kg), 9 recipes, 4 suppliers.
  - **Zero fake orders, zero fake KOTs, zero fake customers.**

---

## 3. Backend Verification Test Suite Results

All 15 backend test modules were executed against real PostgreSQL 16:

```
tests/test_ai.py::test_chotu_ai_sales_query PASSED                       [  1%]
tests/test_ai.py::test_chotu_ai_table_query PASSED                       [  3%]
tests/test_ai.py::test_chotu_ai_inventory_query PASSED                   [  5%]
tests/test_analytics.py::test_analytics_overview PASSED                  [  7%]
tests/test_auth.py::test_login_success PASSED                            [  8%]
tests/test_auth.py::test_login_invalid_password PASSED                   [ 10%]
tests/test_auth.py::test_get_me PASSED                                   [ 12%]
tests/test_e2e_lifecycle.py::test_complete_cross_module_restaurant_lifecycle PASSED [ 14%]
tests/test_full_integrated_lifecycle.py::test_full_e2e_restaurant_lifecycle_workflow PASSED [ 15%]
tests/test_inventory.py::test_inventory_management PASSED                [ 17%]
tests/test_kds.py::test_kds_bump_and_recall PASSED                       [ 19%]
tests/test_phase3_acceptance.py::test_01_table_transfer_validation_rules PASSED [ 21%]
tests/test_phase3_acceptance.py::test_02_pos_table_isolation_and_quantity_lifecycle PASSED [ 22%]
tests/test_phase3_acceptance.py::test_03_financial_math_gst_and_settlement PASSED [ 24%]
tests/test_phase3_acceptance.py::test_04_kot_generation_kds_tracking_and_bumping PASSED [ 26%]
tests/test_phase3_acceptance.py::test_05_qr_ordering_multi_channel_sync PASSED [ 28%]
tests/test_phase3_acceptance.py::test_06_edge_cases_and_error_handling PASSED [ 29%]
tests/test_phase4_admin_operations.py::test_owner_can_read_and_update_settings PASSED [ 31%]
tests/test_phase4_admin_operations.py::test_cashier_and_waiter_cannot_update_settings PASSED [ 33%]
tests/test_phase4_admin_operations.py::test_staff_management_rbac_and_status_toggle PASSED [ 35%]
tests/test_phase4_admin_operations.py::test_customer_phone_normalization_and_creation PASSED [ 36%]
tests/test_phase4_admin_operations.py::test_loyalty_points_award_upon_order_settlement PASSED [ 38%]
tests/test_phase4_admin_operations.py::test_manual_loyalty_adjustment_and_balance_protection PASSED [ 40%]
tests/test_phase4_admin_operations.py::test_delivery_dispatch_and_secure_otp_verification PASSED [ 42%]
tests/test_phase4_admin_operations.py::test_delivery_otp_lockout_after_max_attempts PASSED [ 43%]
tests/test_phase4_admin_operations.py::test_supplier_and_purchase_order_wac_recalculation PASSED [ 45%]
tests/test_phase4_admin_operations.py::test_notification_fingerprint_deduplication PASSED [ 47%]
tests/test_phase4_admin_operations.py::test_menu_item_variants_and_photo_url PASSED [ 49%]
tests/test_pos_tables.py::test_table_independence PASSED                 [ 50%]
tests/test_pos_tables.py::test_pos_fire_kot_and_settlement PASSED        [ 52%]
tests/test_postgres_integration.py::test_01_postgresql_database_connection PASSED [ 54%]
tests/test_postgres_integration.py::test_02_integration_auth_login PASSED [ 56%]
tests/test_postgres_integration.py::test_03_integration_dining_tables PASSED [ 57%]
tests/test_postgres_integration.py::test_04_integration_menu_catalog PASSED [ 59%]
tests/test_postgres_integration.py::test_05_integration_pos_table_order PASSED [ 61%]
tests/test_postgres_integration.py::test_06_integration_kds_kots PASSED  [ 63%]
tests/test_postgres_integration.py::test_07_integration_qr_ordering PASSED [ 64%]
tests/test_postgres_integration.py::test_08_integration_inventory_management PASSED [ 66%]
tests/test_postgres_integration.py::test_09_integration_analytics_dashboard PASSED [ 68%]
tests/test_postgres_integration.py::test_10_integration_ai_conversation_persistence PASSED [ 70%]
tests/test_qr_order.py::test_qr_menu_and_order_flow PASSED               [ 71%]
tests/test_qr_order.py::test_qr_table_info_endpoint PASSED               [ 73%]
tests/test_qr_order.py::test_qr_invalid_tokens_return_404 PASSED         [ 75%]
tests/test_qr_order.py::test_qr_out_of_stock_item_rejected PASSED        [ 77%]
tests/test_qr_order.py::test_table_qr_regeneration_flow PASSED           [ 78%]
tests/test_qr_postgres_acceptance.py::test_complete_20_step_qr_postgresql_acceptance_lifecycle PASSED [ 80%]
tests/test_qr_security.py::test_01_token_entropy_and_unpredictability PASSED [ 82%]
tests/test_qr_security.py::test_02_rbac_on_qr_regeneration_every_role PASSED [ 84%]
tests/test_qr_security.py::test_03_multi_tenant_table_isolation_on_regeneration PASSED [ 85%]
tests/test_qr_security.py::test_04_immediate_token_invalidation PASSED   [ 87%]
tests/test_qr_security.py::test_05_cross_table_mismatch_rejection PASSED [ 89%]
tests/test_qr_security.py::test_06_price_manipulation_immunity PASSED    [ 91%]
tests/test_qr_security.py::test_07_invalid_quantity_boundary_validation PASSED [ 92%]
tests/test_qr_security.py::test_08_out_of_stock_item_rejected PASSED     [ 94%]
tests/test_qr_security.py::test_09_idempotency_prevents_duplicate_orders PASSED [ 96%]
tests/test_qr_security.py::test_10_incremental_orders_do_not_double_deduct_inventory PASSED [ 98%]
tests/test_table_transfer.py::test_table_transfer_endpoint PASSED        [100%]

====================== 57 passed, 12 warnings in 21.81s =======================
```
* **Total Tests Executed:** 57
* **Tests Passed:** **57 (100%)**
* **Regressions:** **0**
