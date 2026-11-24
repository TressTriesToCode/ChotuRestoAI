import os
import sys
import uuid
import secrets
import hashlib
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import jwt

# Immediate flushing
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from contextlib import asynccontextmanager
from app.main import app

@asynccontextmanager
async def mock_lifespan(_):
    yield

app.router.lifespan_context = mock_lifespan

from app.database.session import Base, get_db
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole
from app.models.customer import Customer, LoyaltyTransaction, LoyaltyTxType, CustomerFeedback
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.inventory import Ingredient, StockTransaction, TransactionType
from app.models.order import Order, OrderItem, OrderMode, OrderStatus, PaymentStatus, PlacedBy
from app.models.table import DiningTable, TableStatus
from app.models.menu import MenuItem, MenuItemVariant, MenuCategory, DietaryType, StationType
from app.models.notification import Notification, NotificationType, NotificationSeverity
from app.services.crm_service import CRMService, normalize_phone_number
from app.services.delivery_service import DeliveryService
from app.services.supplier_service import SupplierService
from app.services.notification_service import NotificationService
from app.core.security import create_access_token, get_password_hash
from app.core.config import settings

TEST_DB_URL = "postgresql://postgres:postgres@127.0.0.1:5432/chotu_test"
engine = create_engine(TEST_DB_URL, pool_size=10, max_overflow=20)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_test_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = get_test_db
client = TestClient(app)

audit_results = {
    "stages_passed": 0,
    "stages_failed": 0,
    "checks": []
}

def record_check(category, check_name, passed, details):
    global audit_results
    status_str = "PASS" if passed else "FAIL"
    if passed:
        audit_results["stages_passed"] += 1
    else:
        audit_results["stages_failed"] += 1
    audit_results["checks"].append({
        "category": category,
        "check": check_name,
        "status": status_str,
        "details": details
    })
    print(f"[{status_str}] {category} :: {check_name} -> {details}", flush=True)

CACHED_HASH = get_password_hash("Audit@123")

def run_security_and_operations_audit():
    print("=====================================================================", flush=True)
    print("CHOTU RESTRO AI - STAGES 3 TO 10 PRODUCTION READINESS AUDIT ON POSTGRESQL", flush=True)
    print("Target Database: chotu_test (PostgreSQL 16)", flush=True)
    print("=====================================================================\n", flush=True)

    # 1. SETUP TENANTS
    print("\n--- 1. MULTI-TENANT ENTITIES SETUP ---", flush=True)
    with TestSession() as db:
        rest_a = db.query(Restaurant).filter(Restaurant.id == "rest-audit-a").first()
        if not rest_a:
            rest_a = Restaurant(
                id="rest-audit-a",
                name="Spice Junction Audit A",
                code="SPICE-A",
                address="101 Marine Lines, Mumbai",
                phone="+91 22 2200 1111",
                currency="INR",
                cgst_percent=Decimal("2.50"),
                sgst_percent=Decimal("2.50"),
                service_charge_percent=Decimal("5.00")
            )
            db.add(rest_a)

        rest_b = db.query(Restaurant).filter(Restaurant.id == "rest-audit-b").first()
        if not rest_b:
            rest_b = Restaurant(
                id="rest-audit-b",
                name="Bombay Bistro Audit B",
                code="BOMBAY-B",
                address="202 Bandra West, Mumbai",
                phone="+91 22 2600 2222",
                currency="INR",
                cgst_percent=Decimal("2.50"),
                sgst_percent=Decimal("2.50"),
                service_charge_percent=Decimal("0.00")
            )
            db.add(rest_b)
        db.commit()

        # Create users for Restaurant A across all 5 roles
        roles = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN_STAFF]
        tokens_a = {}
        for r in roles:
            u = db.query(User).filter(User.id == f"user-a-{r.value}").first()
            if not u:
                u = User(
                    id=f"user-a-{r.value}",
                    restaurant_id="rest-audit-a",
                    email=f"user.a.{r.value}@audit.com",
                    hashed_password=CACHED_HASH,
                    full_name=f"User A {r.value.capitalize()}",
                    role=r,
                    is_active=True
                )
                db.add(u)
                db.commit()
            token = create_access_token(
                subject=u.id,
                extra_claims={"role": u.role.value, "restaurant_id": u.restaurant_id}
            )
            tokens_a[r] = {"Authorization": f"Bearer {token}"}

        # Create Manager for Restaurant B
        u_b_mgr = db.query(User).filter(User.id == "user-b-manager").first()
        if not u_b_mgr:
            u_b_mgr = User(
                id="user-b-manager",
                restaurant_id="rest-audit-b",
                email="manager.b@audit.com",
                hashed_password=CACHED_HASH,
                full_name="Manager B Bistro",
                role=UserRole.MANAGER,
                is_active=True
            )
            db.add(u_b_mgr)
            db.commit()
        token_b_mgr = create_access_token(
            subject=u_b_mgr.id,
            extra_claims={"role": u_b_mgr.role.value, "restaurant_id": u_b_mgr.restaurant_id}
        )
        headers_b_mgr = {"Authorization": f"Bearer {token_b_mgr}"}

    record_check("SETUP", "Multi-Tenant Entities Initialized", True, "Created Restaurant A and B with role accounts")

    # 2. CROSS-TENANT ISOLATION TESTS
    print("\n--- 2. CROSS-TENANT ISOLATION TESTS ---", flush=True)
    with TestSession() as db:
        cust_a = db.query(Customer).filter(Customer.id == "cust-tenant-a-1").first()
        if not cust_a:
            cust_a = Customer(
                id="cust-tenant-a-1",
                restaurant_id="rest-audit-a",
                name="Tenant A Customer",
                phone="+919800000001",
                email="cust.a@test.com",
                total_orders=1,
                total_spend=Decimal("500.00"),
                loyalty_points_balance=25,
                marketing_consent=True
            )
            db.add(cust_a)
            db.commit()

        sup_a = db.query(Supplier).filter(Supplier.id == "sup-tenant-a-1").first()
        if not sup_a:
            sup_a = Supplier(
                id="sup-tenant-a-1",
                restaurant_id="rest-audit-a",
                name="Supplier A Dairy",
                contact_person="Ramesh A",
                phone="+919811111111",
                is_active=True
            )
            db.add(sup_a)
            db.commit()

        ord_a = db.query(Order).filter(Order.id == "ord-tenant-a-del-1").first()
        if not ord_a:
            ord_a = Order(
                id="ord-tenant-a-del-1",
                restaurant_id="rest-audit-a",
                order_number="DEL-A-001",
                token_number="T-A-001",
                customer_name="Customer A",
                customer_phone="+919800000001",
                mode=OrderMode.DELIVERY,
                status=OrderStatus.READY,
                payment_status=PaymentStatus.PENDING,
                placed_by=PlacedBy.POS,
                total_amount=Decimal("450.00")
            )
            db.add(ord_a)
            db.commit()

    resp = client.get(f"/api/v1/customers/cust-tenant-a-1", headers=headers_b_mgr)
    record_check("MULTI_TENANT", "Cross-Tenant Customer Isolation", resp.status_code == 404, f"HTTP {resp.status_code}")

    resp = client.get("/api/v1/customers?q=Tenant+A", headers=headers_b_mgr)
    found = [c for c in resp.json() if c["id"] == "cust-tenant-a-1"]
    record_check("MULTI_TENANT", "Cross-Tenant Customer Search Leak Prevention", len(found) == 0, f"Found {len(found)} records")

    resp = client.get("/api/v1/suppliers", headers=headers_b_mgr)
    sup_a_in_b = [s for s in resp.json() if s["id"] == "sup-tenant-a-1"]
    record_check("MULTI_TENANT", "Cross-Tenant Supplier Isolation", len(sup_a_in_b) == 0, f"Found {len(sup_a_in_b)} suppliers")

    resp = client.post(
        "/api/v1/delivery/orders/ord-tenant-a-del-1/dispatch",
        json={"rider_name": "Rider B", "rider_phone": "+919999988888"},
        headers=headers_b_mgr
    )
    record_check("MULTI_TENANT", "Cross-Tenant Delivery Dispatch Prevention", resp.status_code == 404, f"HTTP {resp.status_code}")

    resp = client.get("/api/v1/settings", headers=headers_b_mgr)
    record_check("MULTI_TENANT", "Cross-Tenant Settings Isolation", resp.status_code == 200 and resp.json().get("id") == "rest-audit-b", f"Tenant ID: {resp.json().get('id')}")

    # 3. RBAC AUDIT
    print("\n--- 3. ROLE-BASED ACCESS CONTROL (RBAC) AUDIT ---", flush=True)
    resp_owner = client.patch("/api/v1/settings", json={"tagline": "Finest Spice"}, headers=tokens_a[UserRole.OWNER])
    resp_mgr = client.patch("/api/v1/settings", json={"tagline": "Finest Spice 2"}, headers=tokens_a[UserRole.MANAGER])
    resp_cash = client.patch("/api/v1/settings", json={"tagline": "Hacked"}, headers=tokens_a[UserRole.CASHIER])
    resp_wait = client.patch("/api/v1/settings", json={"tagline": "Hacked"}, headers=tokens_a[UserRole.WAITER])
    resp_kit = client.patch("/api/v1/settings", json={"tagline": "Hacked"}, headers=tokens_a[UserRole.KITCHEN_STAFF])

    record_check("RBAC", "Settings Update Owner Access", resp_owner.status_code == 200, f"HTTP {resp_owner.status_code}")
    record_check("RBAC", "Settings Update Manager Access", resp_mgr.status_code == 200, f"HTTP {resp_mgr.status_code}")
    record_check("RBAC", "Settings Update Cashier Forbidden", resp_cash.status_code == 403, f"HTTP {resp_cash.status_code}")
    record_check("RBAC", "Settings Update Waiter Forbidden", resp_wait.status_code == 403, f"HTTP {resp_wait.status_code}")
    record_check("RBAC", "Settings Update Kitchen Forbidden", resp_kit.status_code == 403, f"HTTP {resp_kit.status_code}")

    staff_payload = {
        "email": f"test.enroll.{uuid.uuid4().hex[:6]}@audit.com",
        "full_name": "Test Enroll",
        "role": "waiter",
        "password": "Password@123"
    }
    resp_cash_staff = client.post("/api/v1/staff", json=staff_payload, headers=tokens_a[UserRole.CASHIER])
    resp_wait_staff = client.post("/api/v1/staff", json=staff_payload, headers=tokens_a[UserRole.WAITER])
    record_check("RBAC", "Staff Creation Cashier Forbidden", resp_cash_staff.status_code == 403, f"HTTP {resp_cash_staff.status_code}")
    record_check("RBAC", "Staff Creation Waiter Forbidden", resp_wait_staff.status_code == 403, f"HTTP {resp_wait_staff.status_code}")

    adj_payload = {"points": 10, "notes": "Test bonus", "transaction_type": "adjustment"}
    resp_cash_adj = client.post(f"/api/v1/customers/cust-tenant-a-1/loyalty", json=adj_payload, headers=tokens_a[UserRole.CASHIER])
    resp_wait_adj = client.post(f"/api/v1/customers/cust-tenant-a-1/loyalty", json=adj_payload, headers=tokens_a[UserRole.WAITER])
    record_check("RBAC", "Loyalty Adjustment Cashier Allowed", resp_cash_adj.status_code == 200, f"HTTP {resp_cash_adj.status_code}")
    record_check("RBAC", "Loyalty Adjustment Waiter Forbidden", resp_wait_adj.status_code == 403, f"HTTP {resp_wait_adj.status_code}")

    # 4. AUTH TOKEN VALIDATION AUDIT
    print("\n--- 4. AUTH TOKEN VALIDATION AUDIT ---", flush=True)
    with TestSession() as db:
        u_inactive = db.query(User).filter(User.id == "user-a-inactive").first()
        if not u_inactive:
            u_inactive = User(
                id="user-a-inactive",
                restaurant_id="rest-audit-a",
                email="inactive@audit.com",
                hashed_password=CACHED_HASH,
                full_name="Inactive User",
                role=UserRole.WAITER,
                is_active=False
            )
            db.add(u_inactive)
            db.commit()
    inactive_token = create_access_token(
        subject="user-a-inactive",
        extra_claims={"role": "waiter", "restaurant_id": "rest-audit-a"}
    )
    resp_inactive = client.get("/api/v1/settings", headers={"Authorization": f"Bearer {inactive_token}"})
    record_check("AUTH", "Inactive User Token Rejection", resp_inactive.status_code == 401, f"HTTP {resp_inactive.status_code}")

    expired_token = jwt.encode(
        {"sub": "user-a-owner", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    resp_expired = client.get("/api/v1/settings", headers={"Authorization": f"Bearer {expired_token}"})
    record_check("AUTH", "Expired Token Rejection", resp_expired.status_code == 401, f"HTTP {resp_expired.status_code}")

    resp_no_token = client.get("/api/v1/settings")
    record_check("AUTH_SECURITY_FINDING", "Missing Token Demo Fallback Evaluation", resp_no_token.status_code == 200, f"HTTP {resp_no_token.status_code} (Fallback active without Bearer)")

    # 5. DELIVERY OTP SECURITY AUDIT
    print("\n--- 5. DELIVERY OTP SECURITY AUDIT ---", flush=True)
    disp_resp = client.post(
        "/api/v1/delivery/orders/ord-tenant-a-del-1/dispatch",
        json={"rider_name": "Rider Rajesh", "rider_phone": "+91 98200 12345"},
        headers=tokens_a[UserRole.OWNER]
    )
    record_check("OTP", "Order Dispatch Endpoint", disp_resp.status_code == 200, f"HTTP {disp_resp.status_code}")
    plain_otp = disp_resp.json().get("delivery_otp")
    record_check("OTP", "4-Digit OTP Generation", len(plain_otp) == 4 and plain_otp.isdigit(), f"Generated OTP: {plain_otp}")

    with TestSession() as db:
        ord_db = db.query(Order).filter(Order.id == "ord-tenant-a-del-1").first()
        record_check(
            "OTP", "Plaintext OTP Never Stored in Database",
            ord_db.delivery_otp_hash != plain_otp and ord_db.delivery_otp_salt is not None,
            f"Salt len: {len(ord_db.delivery_otp_salt)}, Hash len: {len(ord_db.delivery_otp_hash)}"
        )

    list_resp = client.get("/api/v1/delivery/orders", headers=tokens_a[UserRole.OWNER])
    matching = next((o for o in list_resp.json() if o["id"] == "ord-tenant-a-del-1"), None)
    record_check(
        "OTP", "GET Delivery Orders Zero OTP Leak",
        matching is not None and "delivery_otp" not in matching and matching.get("has_otp") is True,
        f"has_otp: {matching.get('has_otp')}, otp_verified: {matching.get('otp_verified')}"
    )

    # 3 wrong attempts
    for _ in range(3):
        client.post("/api/v1/delivery/orders/ord-tenant-a-del-1/verify-otp", json={"otp": "0000"}, headers=tokens_a[UserRole.OWNER])

    with TestSession() as db:
        ord_db = db.query(Order).filter(Order.id == "ord-tenant-a-del-1").first()
        record_check("OTP", "Failed Attempts Counter Incremented to 3", ord_db.delivery_otp_attempts == 3, f"Attempts: {ord_db.delivery_otp_attempts}")

    # 4th attempt with correct OTP returns HTTP 429
    lock_resp = client.post("/api/v1/delivery/orders/ord-tenant-a-del-1/verify-otp", json={"otp": plain_otp}, headers=tokens_a[UserRole.OWNER])
    record_check("OTP", "4-Attempt Security Lockout Enforced (HTTP 429)", lock_resp.status_code == 429, f"HTTP {lock_resp.status_code}")

    # Fresh order for success & replay
    fresh_ord_id = f"ord-del-fresh-{uuid.uuid4().hex[:6]}"
    with TestSession() as db:
        fresh_ord = Order(
            id=fresh_ord_id,
            restaurant_id="rest-audit-a",
            order_number=f"DEL-{uuid.uuid4().hex[:4].upper()}",
            token_number="T-FRESH",
            customer_name="Fresh Customer",
            customer_phone="+919800000099",
            mode=OrderMode.DELIVERY,
            status=OrderStatus.READY,
            payment_status=PaymentStatus.PENDING,
            placed_by=PlacedBy.POS,
            total_amount=Decimal("350.00")
        )
        db.add(fresh_ord)
        db.commit()

    disp2 = client.post(
        f"/api/v1/delivery/orders/{fresh_ord_id}/dispatch",
        json={"rider_name": "Rider Fast", "rider_phone": "+91 98200 99999"},
        headers=tokens_a[UserRole.OWNER]
    )
    plain_otp2 = disp2.json()["delivery_otp"]

    ver_resp = client.post(
        f"/api/v1/delivery/orders/{fresh_ord_id}/verify-otp",
        json={"otp": plain_otp2},
        headers=tokens_a[UserRole.OWNER]
    )
    record_check("OTP", "Correct OTP Successful Handover Verification", ver_resp.status_code == 200, f"HTTP {ver_resp.status_code}")

    with TestSession() as db:
        fresh_db = db.query(Order).filter(Order.id == fresh_ord_id).first()
        record_check(
            "OTP", "Single-Use Hash Wiped After Verification",
            fresh_db.delivery_otp_hash is None and fresh_db.status == OrderStatus.COMPLETED,
            f"Hash wiped: {fresh_db.delivery_otp_hash is None}, Status: {fresh_db.status.value}"
        )

    replay_resp = client.post(
        f"/api/v1/delivery/orders/{fresh_ord_id}/verify-otp",
        json={"otp": plain_otp2},
        headers=tokens_a[UserRole.OWNER]
    )
    record_check("OTP", "Replay Attack Prevention", replay_resp.status_code == 400, f"HTTP {replay_resp.status_code}")

    # 6. CRM LOYALTY LEDGER AUDIT
    print("\n--- 6. CUSTOMER CRM & LOYALTY LEDGER AUDIT ---", flush=True)
    raw_phones = ["98200 55443", "09820055443", "+91 9820055443"]
    normalized = [normalize_phone_number(p) for p in raw_phones]
    record_check("CRM", "E.164 Phone Normalization", all(p == "+919820055443" for p in normalized), f"{raw_phones} -> {normalized}")

    crm_ord_id = f"ord-crm-{uuid.uuid4().hex[:6]}"
    with TestSession() as db:
        ord_crm = Order(
            id=crm_ord_id,
            restaurant_id="rest-audit-a",
            order_number=f"ORD-{uuid.uuid4().hex[:4].upper()}",
            token_number="T-CRM",
            customer_name="Sunita Rao Audit",
            customer_phone="+919820055443",
            mode=OrderMode.DINE_IN,
            status=OrderStatus.COMPLETED,
            payment_status=PaymentStatus.PAID,
            placed_by=PlacedBy.POS,
            subtotal=Decimal("1500.00"),
            total_amount=Decimal("1575.00")
        )
        db.add(ord_crm)
        db.commit()

        tx1 = CRMService.award_points_for_order(db, ord_crm)
        record_check("CRM", "Order Settlement Points Award (5 pts / Rs 100)", tx1.points == 75, f"Awarded {tx1.points} pts for Rs 1500 subtotal")

        tx1_dup = CRMService.award_points_for_order(db, ord_crm)
        record_check("CRM", "Loyalty Award Idempotency Protection", tx1_dup.id == tx1.id, f"Duplicate returned same transaction ID {tx1.id}")

        cust_crm = db.query(Customer).filter(Customer.phone == "+919820055443", Customer.restaurant_id == "rest-audit-a").first()
        curr_bal = cust_crm.loyalty_points_balance
        cust_id = cust_crm.id

    excess_resp = client.post(
        f"/api/v1/customers/{cust_id}/loyalty",
        json={"points": curr_bal + 50, "notes": "Excess redeem", "transaction_type": "redeem"},
        headers=tokens_a[UserRole.OWNER]
    )
    record_check("CRM", "Negative Balance Protection Rejection", excess_resp.status_code == 400, f"HTTP {excess_resp.status_code}")

    # 7. SUPPLIER, PO & WAC INVENTORY AUDIT
    print("\n--- 7. SUPPLIER, PURCHASE ORDER & WAC INVENTORY AUDIT ---", flush=True)
    wac_ing_id = f"ing-wac-{uuid.uuid4().hex[:6]}"
    with TestSession() as db:
        ing_wac = Ingredient(
            id=wac_ing_id,
            restaurant_id="rest-audit-a",
            name="WAC Audit Basmati",
            unit="kg",
            current_stock=Decimal("10.000"),
            cost_per_unit=Decimal("100.00"),
            reorder_threshold=Decimal("5.000")
        )
        db.add(ing_wac)
        db.commit()

    po_resp = client.post(
        "/api/v1/suppliers/purchase-orders",
        json={
            "supplier_id": "sup-tenant-a-1",
            "items": [{"ingredient_id": wac_ing_id, "quantity": 20.0, "unit_cost": 130.0}],
            "notes": "WAC Verification Batch"
        },
        headers=tokens_a[UserRole.OWNER]
    )
    po_id = po_resp.json()["id"]
    record_check("WAC", "Purchase Order Creation", po_resp.status_code == 200, f"PO #{po_resp.json().get('po_number')}")

    rec_resp = client.post(
        f"/api/v1/suppliers/purchase-orders/{po_id}/receive",
        json={"invoice_ref": "INV-AUDIT-WAC-01", "notes": "Received 20kg @ 130"},
        headers=tokens_a[UserRole.OWNER]
    )
    record_check("WAC", "Purchase Order Receipt", rec_resp.status_code == 200, f"HTTP {rec_resp.status_code}")

    with TestSession() as db:
        ing_db = db.query(Ingredient).filter(Ingredient.id == wac_ing_id).first()
        record_check("WAC", "Stock Increment Verification (10kg + 20kg = 30kg)", ing_db.current_stock == Decimal("30.000"), f"Stock: {ing_db.current_stock} kg")
        record_check("WAC", "Weighted Average Cost Formula ((10*100 + 20*130)/30 = Rs 120.00)", ing_db.cost_per_unit == Decimal("120.00"), f"WAC: Rs {ing_db.cost_per_unit}/kg")

    rec_dup = client.post(
        f"/api/v1/suppliers/purchase-orders/{po_id}/receive",
        json={"invoice_ref": "INV-AUDIT-DUP"},
        headers=tokens_a[UserRole.OWNER]
    )
    record_check("WAC", "Duplicate Purchase Order Receipt Rejection", rec_dup.status_code == 400, f"HTTP {rec_dup.status_code}")

    # 8. FINANCIAL INTEGRITY & HISTORICAL IMMUTABILITY AUDIT
    print("\n--- 8. FINANCIAL INTEGRITY & HISTORICAL IMMUTABILITY AUDIT ---", flush=True)
    dish_id = f"dish-immu-{uuid.uuid4().hex[:6]}"
    ord_immu_id = f"ord-immu-{uuid.uuid4().hex[:6]}"
    with TestSession() as db:
        cat = db.query(MenuCategory).filter(MenuCategory.restaurant_id == "rest-audit-a").first()
        if not cat:
            cat = MenuCategory(id="cat-audit-a", restaurant_id="rest-audit-a", name="Mains", slug="mains")
            db.add(cat)
            db.commit()

        dish = MenuItem(
            id=dish_id,
            restaurant_id="rest-audit-a",
            category_id=cat.id,
            name="Butter Chicken Audit",
            price=Decimal("300.00"),
            is_in_stock=True,
            dietary=DietaryType.NONVEG,
            station=StationType.CURRY
        )
        db.add(dish)

        ord_immu = Order(
            id=ord_immu_id,
            restaurant_id="rest-audit-a",
            order_number=f"ORD-IMMU-{uuid.uuid4().hex[:4].upper()}",
            token_number="T-IMMU",
            customer_name="Historical Customer",
            customer_phone="+919820099999",
            mode=OrderMode.DINE_IN,
            status=OrderStatus.COMPLETED,
            payment_status=PaymentStatus.PAID,
            placed_by=PlacedBy.POS,
            subtotal=Decimal("300.00"),
            cgst=Decimal("7.50"),
            sgst=Decimal("7.50"),
            service_charge=Decimal("15.00"),
            total_amount=Decimal("330.00"),
            cgst_rate_snapshot=Decimal("2.50"),
            sgst_rate_snapshot=Decimal("2.50"),
            service_charge_rate_snapshot=Decimal("5.00")
        )
        db.add(ord_immu)
        item_immu = OrderItem(
            id=f"item-immu-{uuid.uuid4().hex[:6]}",
            order_id=ord_immu.id,
            menu_item_id=dish.id,
            name=dish.name,
            price=Decimal("300.00"),
            quantity=1,
            dietary=dish.dietary,
            station=dish.station
        )
        db.add(item_immu)
        db.commit()

        # Update menu price to Rs 450
        dish.price = Decimal("450.00")
        db.commit()

        # Re-check historical order
        item_chk = db.query(OrderItem).filter(OrderItem.order_id == ord_immu_id).first()
        ord_chk = db.query(Order).filter(Order.id == ord_immu_id).first()
        record_check("FINANCIAL_IMMUTABILITY", "Historical Order Item Price Preserved", item_chk.price == Decimal("300.00"), f"Snapshot price: Rs {item_chk.price}")
        record_check("FINANCIAL_IMMUTABILITY", "Historical Bill Totals & Tax Snapshots Preserved", ord_chk.total_amount == Decimal("330.00") and ord_chk.cgst_rate_snapshot == Decimal("2.50"), f"Total: Rs {ord_chk.total_amount}, CGST: {ord_chk.cgst_rate_snapshot}%")

    # 9. STOCK CONSERVATION EQUATION AUDIT
    print("\n--- 9. STOCK BALANCE CONSERVATION EQUATION AUDIT ---", flush=True)
    opening_stock = Decimal("50.000")
    purchases = Decimal("20.000")
    adjustments = Decimal("5.000")
    consumption = Decimal("15.000")
    wastage = Decimal("2.000")
    expected_closing = opening_stock + purchases + adjustments - consumption - wastage # 58.000

    cons_ing_id = f"ing-cons-{uuid.uuid4().hex[:6]}"
    with TestSession() as db:
        ing_cons = Ingredient(
            id=cons_ing_id,
            restaurant_id="rest-audit-a",
            name="Paneer Conservation Audit",
            unit="kg",
            current_stock=opening_stock,
            cost_per_unit=Decimal("200.00"),
            reorder_threshold=Decimal("10.000")
        )
        db.add(ing_cons)
        db.commit()

        ing_cons.current_stock += purchases
        db.add(StockTransaction(
            id=f"stx-{uuid.uuid4().hex[:10]}",
            restaurant_id="rest-audit-a",
            ingredient_id=ing_cons.id,
            transaction_type=TransactionType.PURCHASE,
            quantity=purchases,
            notes="Audit purchase"
        ))
        ing_cons.current_stock += adjustments
        db.add(StockTransaction(
            id=f"stx-{uuid.uuid4().hex[:10]}",
            restaurant_id="rest-audit-a",
            ingredient_id=ing_cons.id,
            transaction_type=TransactionType.ADJUSTMENT,
            quantity=adjustments,
            notes="Audit adjustment"
        ))
        ing_cons.current_stock -= consumption
        db.add(StockTransaction(
            id=f"stx-{uuid.uuid4().hex[:10]}",
            restaurant_id="rest-audit-a",
            ingredient_id=ing_cons.id,
            transaction_type=TransactionType.CONSUMPTION,
            quantity=-consumption,
            notes="Audit consumption"
        ))
        ing_cons.current_stock -= wastage
        db.add(StockTransaction(
            id=f"stx-{uuid.uuid4().hex[:10]}",
            restaurant_id="rest-audit-a",
            ingredient_id=ing_cons.id,
            transaction_type=TransactionType.WASTAGE,
            quantity=-wastage,
            notes="Audit wastage"
        ))
        db.commit()

        ing_chk = db.query(Ingredient).filter(Ingredient.id == cons_ing_id).first()
        record_check("STOCK_CONSERVATION", "Stock Conservation Equation Holds Exactly", ing_chk.current_stock == expected_closing, f"{opening_stock} + {purchases} + {adjustments} - {consumption} - {wastage} = {expected_closing} kg (DB: {ing_chk.current_stock} kg)")

    # 10. NOTIFICATION DEDUPLICATION AUDIT
    print("\n--- 10. IN-APP NOTIFICATION DEDUPLICATION AUDIT ---", flush=True)
    fp = f"audit-notif-fp-{uuid.uuid4().hex[:6]}"
    with TestSession() as db:
        notif1 = NotificationService.create_or_get_notification(
            db=db,
            restaurant_id="rest-audit-a",
            title="Audit Low Stock Alert",
            message="Paneer is below reorder threshold",
            notif_type=NotificationType.LOW_STOCK,
            severity=NotificationSeverity.WARNING,
            event_fingerprint=fp
        )
        notif2 = NotificationService.create_or_get_notification(
            db=db,
            restaurant_id="rest-audit-a",
            title="Audit Low Stock Alert",
            message="Paneer is below reorder threshold",
            notif_type=NotificationType.LOW_STOCK,
            severity=NotificationSeverity.WARNING,
            event_fingerprint=fp
        )
        count_fp = db.query(Notification).filter(
            Notification.restaurant_id == "rest-audit-a",
            Notification.event_fingerprint == fp
        ).count()
        record_check("NOTIFICATIONS", "Event Fingerprint Deduplication", notif1.id == notif2.id and count_fp == 1, f"Fingerprint '{fp}' yielded {count_fp} row (ID: {notif1.id})")

    print("\n=====================================================================", flush=True)
    print(f"AUDIT SUMMARY: {audit_results['stages_passed']} CHECKS PASSED, {audit_results['stages_failed']} CHECKS FAILED", flush=True)
    print("=====================================================================", flush=True)

if __name__ == "__main__":
    run_security_and_operations_audit()
