import pytest
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from app.models.restaurant import Restaurant
from app.models.user import User, UserRole
from app.models.customer import Customer, LoyaltyTransaction, LoyaltyTxType
from app.models.supplier import Supplier, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.inventory import Ingredient, StockTransaction, TransactionType
from app.models.order import Order, OrderItem, OrderMode, OrderStatus, PaymentStatus, PlacedBy
from app.models.table import DiningTable, TableStatus
from app.models.menu import MenuItem, MenuItemVariant, MenuCategory, DietaryType, StationType
from app.models.notification import Notification, NotificationType, NotificationSeverity
from app.services.crm_service import CRMService
from app.services.delivery_service import DeliveryService
from app.services.supplier_service import SupplierService
from app.services.notification_service import NotificationService
from app.core.security import create_access_token, get_password_hash

# --- FIXTURES ---

@pytest.fixture
def auth_headers(db_session):
    """Helper to generate JWT bearer headers for various roles."""
    def _get_headers(role=UserRole.OWNER, restaurant_id="rest-spice-jct"):
        user = db_session.query(User).filter(
            User.role == role,
            User.restaurant_id == restaurant_id
        ).first()
        if not user:
            user = User(
                id=f"user-{role.value}",
                restaurant_id=restaurant_id,
                email=f"{role.value}@test.com",
                hashed_password=get_password_hash("Test@123"),
                full_name=f"Test {role.value.capitalize()}",
                role=role,
                is_active=True
            )
            db_session.add(user)
            db_session.commit()
            
        token = create_access_token(
            subject=user.id,
            extra_claims={
                "role": user.role.value,
                "restaurant_id": user.restaurant_id
            }
        )
        return {"Authorization": f"Bearer {token}"}
    return _get_headers

# --- 1. RBAC & RESTAURANT SETTINGS TESTS ---

def test_owner_can_read_and_update_settings(client, auth_headers):
    headers = auth_headers(role=UserRole.OWNER)
    
    # 1. Read settings
    resp = client.get("/api/v1/settings", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "The Spice Junction"
    
    # 2. Update settings
    update_payload = {
        "tagline": "Finest Royal Cuisine in Town",
        "gstin": "27AABCU9603R1ZM",
        "fssai_number": "11521005000432",
        "cgst_rate": 2.5,
        "sgst_rate": 2.5,
        "service_charge_rate": 5.0,
        "service_charge_enabled": True,
        "upi_vpa": "spicejunction@icici",
        "invoice_prefix": "SJC",
        "timezone": "Asia/Kolkata"
    }
    resp = client.patch("/api/v1/settings", json=update_payload, headers=headers)
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["tagline"] == "Finest Royal Cuisine in Town"
    assert updated["gstin"] == "27AABCU9603R1ZM"
    assert updated["invoice_prefix"] == "SJC"

def test_cashier_and_waiter_cannot_update_settings(client, auth_headers):
    # Cashier attempt
    cashier_headers = auth_headers(role=UserRole.CASHIER)
    resp = client.patch(
        "/api/v1/settings",
        json={"name": "Hacked Name"},
        headers=cashier_headers
    )
    assert resp.status_code == 403
    
    # Waiter attempt
    waiter_headers = auth_headers(role=UserRole.WAITER)
    resp = client.patch(
        "/api/v1/settings",
        json={"name": "Hacked Name"},
        headers=waiter_headers
    )
    assert resp.status_code == 403

def test_staff_management_rbac_and_status_toggle(client, auth_headers, db_session):
    owner_headers = auth_headers(role=UserRole.OWNER)
    
    # 1. Owner enrolls a new staff member
    new_staff_payload = {
        "email": "priya.waiter@spicejunction.in",
        "full_name": "Priya Deshmukh",
        "role": "waiter",
        "password": "Password@123",
        "phone": "+91 98200 88776"
    }
    resp = client.post("/api/v1/staff", json=new_staff_payload, headers=owner_headers)
    assert resp.status_code in (200, 201)
    created = resp.json()
    assert created["email"] == "priya.waiter@spicejunction.in"
    assert created["is_active"] is True
    staff_id = created["id"]
    
    # 2. Cashier cannot enroll staff
    cashier_headers = auth_headers(role=UserRole.CASHIER)
    resp = client.post("/api/v1/staff", json=new_staff_payload, headers=cashier_headers)
    assert resp.status_code == 403
    
    # 3. Owner can deactivate staff
    resp = client.patch(f"/api/v1/staff/{staff_id}/status", json={"is_active": False}, headers=owner_headers)
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

# --- 2. CUSTOMER CRM & IMMUTABLE LOYALTY LEDGER TESTS ---

def test_customer_phone_normalization_and_creation(client, auth_headers):
    headers = auth_headers(role=UserRole.CASHIER)
    
    # Send 10-digit Indian phone without country code
    payload = {
        "name": "Arjun Kapoor",
        "phone": "98200 99887",
        "email": "arjun@example.com",
        "marketing_consent": True,
        "tags": "VIP"
    }
    resp = client.post("/api/v1/customers", json=payload, headers=headers)
    assert resp.status_code in (200, 201)
    cust = resp.json()
    assert cust["phone"] == "+919820099887"
    assert cust["loyalty_points_balance"] == 0
    assert cust["total_orders"] == 0

def test_loyalty_points_award_upon_order_settlement(db_session):
    # Settle an order worth Rs 1,500
    order = Order(
        id="ord-test-loyalty-001",
        restaurant_id="rest-spice-jct",
        order_number="ORD-1001",
        token_number="T-1001",
        customer_name="Sunita Rao",
        customer_phone="+919820011223",
        mode=OrderMode.DINE_IN,
        status=OrderStatus.COMPLETED,
        payment_status=PaymentStatus.PAID,
        placed_by=PlacedBy.POS,
        subtotal=Decimal("1500.00"),
        total_amount=Decimal("1575.00")
    )
    db_session.add(order)
    db_session.commit()
    
    # Award points: 5 points per Rs 100 of subtotal -> 75 points
    tx = CRMService.award_points_for_order(
        db=db_session,
        order=order
    )
    assert tx is not None
    assert tx.points == 75
    
    customer = db_session.query(Customer).filter(Customer.phone == "+919820011223").first()
    assert customer is not None
    assert customer.loyalty_points_balance == 75
    assert customer.total_orders == 1
    assert customer.total_spend == Decimal("1575.00")
    
    # Idempotency check: Re-awarding same order must not add points
    re_tx = CRMService.award_points_for_order(
        db=db_session,
        order=order
    )
    assert re_tx.id == tx.id
    db_session.refresh(customer)
    assert customer.loyalty_points_balance == 75

def test_manual_loyalty_adjustment_and_balance_protection(db_session):
    cust = CRMService.get_or_create_customer(
        db=db_session,
        restaurant_id="rest-spice-jct",
        name="Karan Oberoi",
        phone="9820033445"
    )
    
    # 1. Add 100 points
    tx1 = CRMService.adjust_points(
        db=db_session,
        customer_id=cust.id,
        restaurant_id="rest-spice-jct",
        tx_type=LoyaltyTxType.ADJUSTMENT,
        points=100,
        notes="Birthday Bonus",
        idempotency_key="bday-2026-001"
    )
    assert tx1.balance_after == 100
    db_session.refresh(cust)
    assert cust.loyalty_points_balance == 100
    
    # 2. Idempotent call returns existing tx
    tx1_repeat = CRMService.adjust_points(
        db=db_session,
        customer_id=cust.id,
        restaurant_id="rest-spice-jct",
        tx_type=LoyaltyTxType.ADJUSTMENT,
        points=100,
        notes="Birthday Bonus",
        idempotency_key="bday-2026-001"
    )
    assert tx1_repeat.id == tx1.id
    db_session.refresh(cust)
    assert cust.loyalty_points_balance == 100
    
    # 3. Deduct 40 points
    tx2 = CRMService.adjust_points(
        db=db_session,
        customer_id=cust.id,
        restaurant_id="rest-spice-jct",
        tx_type=LoyaltyTxType.REDEEM,
        points=40,
        notes="Redeemed on dessert",
        idempotency_key="red-001"
    )
    assert tx2.balance_after == 60
    db_session.refresh(cust)
    assert cust.loyalty_points_balance == 60
    
    # 4. Attempt to deduct more than balance (e.g. 100) -> raises HTTPException 400
    with pytest.raises(HTTPException) as exc_info:
        CRMService.adjust_points(
            db=db_session,
            customer_id=cust.id,
            restaurant_id="rest-spice-jct",
            tx_type=LoyaltyTxType.REDEEM,
            points=100,
            notes="Excess deduction"
        )
    assert exc_info.value.status_code == 400

# --- 3. DELIVERY & CRYPTOGRAPHIC OTP TESTS ---

def test_delivery_dispatch_and_secure_otp_verification(db_session):
    # 1. Create a delivery order
    order = Order(
        id="ord-del-test-01",
        restaurant_id="rest-spice-jct",
        order_number="DEL-9901",
        token_number="T-9901",
        customer_name="Rohan Verma",
        customer_phone="+919820077665",
        mode=OrderMode.DELIVERY,
        status=OrderStatus.READY,
        payment_status=PaymentStatus.PENDING,
        placed_by=PlacedBy.POS,
        total_amount=Decimal("680.00")
    )
    db_session.add(order)
    db_session.commit()
    
    # 2. Dispatch with OTP generation
    dispatched_order, plain_otp = DeliveryService.dispatch_order(
        db=db_session,
        order_id=order.id,
        restaurant_id="rest-spice-jct",
        rider_name="Sanjay Valet",
        rider_phone="+919819922334"
    )
    assert len(plain_otp) == 4
    assert plain_otp.isdigit()
    db_session.refresh(order)
    assert order.status == OrderStatus.OUT_FOR_DELIVERY
    assert order.delivery_otp_hash is not None
    assert order.delivery_otp_salt is not None
    assert order.delivery_otp_hash != plain_otp  # Never store plaintext
    
    # 3. Verify with wrong OTP
    with pytest.raises(HTTPException) as exc_wrong:
        DeliveryService.verify_handover_otp(
            db=db_session,
            order_id=order.id,
            restaurant_id="rest-spice-jct",
            entered_otp="0000"
        )
    assert exc_wrong.value.status_code == 400
    db_session.refresh(order)
    assert order.delivery_otp_attempts == 1
    
    # 4. Verify with correct OTP
    verified_order = DeliveryService.verify_handover_otp(
        db=db_session,
        order_id=order.id,
        restaurant_id="rest-spice-jct",
        entered_otp=plain_otp
    )
    assert verified_order.status == OrderStatus.COMPLETED
    assert verified_order.delivery_otp_hash is None  # Single-use: wiped after verification
    assert verified_order.delivered_time is not None

def test_delivery_otp_lockout_after_max_attempts(db_session):
    order = Order(
        id="ord-del-test-02",
        restaurant_id="rest-spice-jct",
        order_number="DEL-9902",
        token_number="T-9902",
        customer_name="Simran Kaur",
        customer_phone="+919820011221",
        mode=OrderMode.DELIVERY,
        status=OrderStatus.READY,
        payment_status=PaymentStatus.PENDING,
        placed_by=PlacedBy.POS,
        total_amount=Decimal("450.00")
    )
    db_session.add(order)
    db_session.commit()
    
    dispatched_order, plain_otp = DeliveryService.dispatch_order(
        db=db_session,
        order_id=order.id,
        restaurant_id="rest-spice-jct",
        rider_name="Fleet Rider",
        rider_phone="+919800011122"
    )
    
    # Attempt 1, 2, 3 with wrong OTP
    for _ in range(3):
        try:
            DeliveryService.verify_handover_otp(db_session, order.id, "rest-spice-jct", "9999")
        except HTTPException:
            pass
            
    db_session.refresh(order)
    assert order.delivery_otp_attempts == 3
    
    # Attempt 4 with correct OTP must now fail due to lockout (HTTP 429)
    with pytest.raises(HTTPException) as exc_lockout:
        DeliveryService.verify_handover_otp(db_session, order.id, "rest-spice-jct", plain_otp)
    assert exc_lockout.value.status_code == 429

# --- 4. SUPPLIER, PO & ROW-LOCKED WAC INVENTORY TESTS ---

def test_supplier_and_purchase_order_wac_recalculation(db_session):
    # 1. Setup raw ingredient with initial stock: 10 kg @ Rs 50/kg
    ingredient = Ingredient(
        id="ing-wac-test",
        restaurant_id="rest-spice-jct",
        name="Basmati Biryani Rice",
        unit="kg",
        current_stock=Decimal("10.000"),
        cost_per_unit=Decimal("50.00"),
        reorder_threshold=Decimal("5.000")
    )
    db_session.add(ingredient)
    db_session.commit()
    
    # 2. Create supplier
    supplier = Supplier(
        id="sup-test-01",
        restaurant_id="rest-spice-jct",
        name="Shree Ganesh Grain Wholesalers",
        contact_person="Ganesh Patil",
        phone="+91 98200 44556",
        gst_number="27AABCU1234F1Z5",
        is_active=True
    )
    db_session.add(supplier)
    db_session.commit()
    
    # 3. Create purchase order: 20 kg @ Rs 80/kg
    po = SupplierService.create_purchase_order(
        db=db_session,
        restaurant_id="rest-spice-jct",
        supplier_id=supplier.id,
        items_data=[
            {
                "ingredient_id": ingredient.id,
                "quantity": Decimal("20.000"),
                "unit_cost": Decimal("80.00")
            }
        ]
    )
    assert po.status == PurchaseOrderStatus.ISSUED
    assert po.total_amount == Decimal("1600.00")
    
    # 4. Receive PO: 20 kg @ actual Rs 80/kg
    # Weighted Average Cost formula:
    # (10 * 50 + 20 * 80) / (10 + 20) = (500 + 1600) / 30 = 2100 / 30 = Rs 70.00/kg
    received_po = SupplierService.receive_purchase_order(
        db=db_session,
        po_id=po.id,
        restaurant_id="rest-spice-jct",
        invoice_ref="INV-GRAIN-882"
    )
    assert received_po.status == PurchaseOrderStatus.RECEIVED
    
    db_session.refresh(ingredient)
    assert ingredient.current_stock == Decimal("30.000")
    assert ingredient.cost_per_unit == Decimal("70.00")
    
    # Verify stock transaction created
    tx = db_session.query(StockTransaction).filter(
        StockTransaction.ingredient_id == ingredient.id,
        StockTransaction.transaction_type == TransactionType.PURCHASE
    ).first()
    assert tx is not None
    assert tx.quantity == Decimal("20.000")

# --- 5. IN-APP NOTIFICATIONS & DEDUPLICATION TESTS ---

def test_notification_fingerprint_deduplication(db_session):
    notif1 = NotificationService.create_or_get_notification(
        db=db_session,
        restaurant_id="rest-spice-jct",
        title="Low Stock: Dairy Cream",
        message="Stock level at 1.2L is below safety threshold 5.0L",
        notif_type=NotificationType.LOW_STOCK,
        severity=NotificationSeverity.WARNING,
        event_fingerprint="inv-low-cream-rest-spice-jct"
    )
    assert notif1 is not None
    
    # Send duplicate with identical fingerprint
    notif2 = NotificationService.create_or_get_notification(
        db=db_session,
        restaurant_id="rest-spice-jct",
        title="Low Stock: Dairy Cream",
        message="Stock level at 1.2L is below safety threshold 5.0L",
        notif_type=NotificationType.LOW_STOCK,
        severity=NotificationSeverity.WARNING,
        event_fingerprint="inv-low-cream-rest-spice-jct"
    )
    # Deduplicated: returns the existing notification without inserting duplicate row
    assert notif2.id == notif1.id
    
    count = db_session.query(Notification).filter(
        Notification.restaurant_id == "rest-spice-jct",
        Notification.event_fingerprint == "inv-low-cream-rest-spice-jct"
    ).count()
    assert count == 1

# --- 6. MENU ITEM VARIANTS & PHOTO URL TESTS ---

def test_menu_item_variants_and_photo_url(client, auth_headers, db_session):
    headers = auth_headers(role=UserRole.OWNER)
    
    # Ensure category exists
    cat = db_session.query(MenuCategory).filter(MenuCategory.restaurant_id == "rest-spice-jct").first()
    if not cat:
        cat = MenuCategory(id="cat-mains", restaurant_id="rest-spice-jct", name="Mains", slug="mains")
        db_session.add(cat)
        db_session.commit()
    
    # 1. Create dish with photo URL and prep time
    dish_payload = {
        "name": "Dum Biryani Special",
        "category_id": cat.id,
        "price": 350.0,
        "description": "Authentic Hyderabadi Dum Biryani cooked with fragrant basmati",
        "dietary": "nonveg",
        "station": "curry",
        "photo_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
        "preparation_time_minutes": 25
    }
    resp = client.post("/api/v1/menu/items", json=dish_payload, headers=headers)
    assert resp.status_code in (200, 201)
    dish = resp.json()
    assert dish["name"] == "Dum Biryani Special"
    assert dish["photo_url"] == "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8"
    assert dish["preparation_time_minutes"] == 25
    
    # 2. Add an additional variant
    variant_payload = {
        "name": "Family Pack (Serves 3)",
        "price": 750.0,
        "is_in_stock": True
    }
    resp = client.post(f"/api/v1/menu/items/{dish['id']}/variants", json=variant_payload, headers=headers)
    assert resp.status_code in (200, 201)
    var_data = resp.json()
    assert var_data["name"] == "Family Pack (Serves 3)"
    assert float(var_data["price"]) == 750.0
    
    # Verify in DB
    variants = db_session.query(MenuItemVariant).filter(
        MenuItemVariant.menu_item_id == dish["id"]
    ).all()
    assert len(variants) == 1
    assert variants[0].name == "Family Pack (Serves 3)"
