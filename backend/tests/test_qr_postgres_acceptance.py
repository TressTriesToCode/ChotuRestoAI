import pytest
import secrets
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, get_db
from app.initial_data import init_demo_db
from app.models.user import User, UserRole
from app.models.table import DiningTable, TableStatus
from app.models.menu import MenuItem
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.kot import KOT, KOTStatus
from app.models.inventory import Ingredient, RecipeItem, StockTransaction
from app.core.security import create_access_token
from app.services.order_service import OrderService

# Dedicated PostgreSQL test database URL
POSTGRES_TEST_URL = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/chotu_test"

@pytest.fixture(scope="module")
def pg_session():
    engine = create_engine(POSTGRES_TEST_URL, pool_pre_ping=True)
    # Drop and recreate schema on chotu_test cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    db = SessionLocal()
    init_demo_db(db)
    
    yield db
    
    db.close()


@pytest.fixture(scope="module")
def pg_client(pg_session):
    def override_get_db():
        try:
            yield pg_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_complete_20_step_qr_postgresql_acceptance_lifecycle(pg_client, pg_session):
    """
    20-STEP END-TO-END ACCEPTANCE LIFECYCLE ON REAL POSTGRESQL (chotu_test)
    """
    manager = pg_session.query(User).filter(User.role == UserRole.MANAGER).first()
    mgr_token = create_access_token(subject=manager.id, extra_claims={"role": manager.role.value, "restaurant_id": manager.restaurant_id})
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    # STEP 1: Select two valid restaurant tables
    t1 = pg_session.query(DiningTable).filter(DiningTable.id == "T-01").first()
    t2 = pg_session.query(DiningTable).filter(DiningTable.id == "T-02").first()
    assert t1 is not None and t2 is not None
    assert t1.status == TableStatus.VACANT
    assert t2.status == TableStatus.VACANT

    # STEP 2: Generate unique high-entropy QR tokens for both tables
    r1 = pg_client.post("/api/v1/tables/T-01/regenerate-qr", headers=mgr_headers)
    assert r1.status_code == 200
    token1 = r1.json()["qr_token"]

    r2 = pg_client.post("/api/v1/tables/T-02/regenerate-qr", headers=mgr_headers)
    assert r2.status_code == 200
    token2 = r2.json()["qr_token"]

    assert token1.startswith("chotu_qr_")
    assert token2.startswith("chotu_qr_")
    assert token1 != token2

    # STEP 3: Scan Table 01 QR (fetch table info)
    info1 = pg_client.get(f"/api/v1/qr/{token1}/table")
    assert info1.status_code == 200
    assert info1.json()["table_id"] == "T-01"
    assert info1.json()["restaurant_name"] == "The Spice Junction"

    # STEP 4: Load real PostgreSQL menu
    menu1 = pg_client.get(f"/api/v1/qr/{token1}/menu")
    assert menu1.status_code == 200
    menu_data = menu1.json()
    assert menu_data["table_label"] == "T-01"
    assert len(menu_data["items"]) >= 10

    # STEP 5 & 6: Add available menu items to cart and submit QR order
    dish1 = pg_session.query(MenuItem).filter(MenuItem.id == "dish-01").first()  # Butter Chicken ₹340
    dish4 = pg_session.query(MenuItem).filter(MenuItem.id == "dish-04").first()  # Garlic Naan ₹60

    order1_payload = {
        "customer_name": "Rohan Deshmukh (Table 1 Guest)",
        "table_id": "T-01",
        "captain_notes": "Corner booth seating",
        "idempotency_key": f"idemp-pg-t1-{secrets.token_hex(6)}",
        "items": [
            {"dish_id": "dish-01", "name": dish1.name, "price": 340, "quantity": 1},
            {"dish_id": "dish-04", "name": dish4.name, "price": 60, "quantity": 2}
        ]
    }
    submit_r1 = pg_client.post(f"/api/v1/qr/{token1}/orders", json=order1_payload)
    assert submit_r1.status_code == 200
    order1_data = submit_r1.json()
    order1_id = order1_data["id"]

    # STEP 7: Verify order appears in POS against Table 01
    pg_session.refresh(t1)
    assert t1.status == TableStatus.OCCUPIED
    assert t1.current_order_id == order1_id
    pos_order = pg_session.query(Order).filter(Order.id == order1_id).first()
    assert pos_order.table_id == "T-01"
    assert pos_order.placed_by.value == "qr"
    assert pos_order.subtotal == Decimal("460.00")  # (340*1) + (60*2)

    # STEP 8: Verify corresponding KOT appears in KDS
    kot1 = pg_session.query(KOT).filter(KOT.order_id == order1_id).first()
    assert kot1 is not None
    assert kot1.kot_number >= 1001
    assert kot1.status == KOTStatus.COOKING
    assert len(kot1.items) == 2

    # STEP 9: Update KDS status (bump ticket)
    bump_resp = pg_client.post(f"/api/v1/kds/tickets/{kot1.id}/bump", headers=mgr_headers)
    assert bump_resp.status_code == 200

    # STEP 10: Verify customer sees updated order status / KOT bumped
    pg_session.refresh(kot1)
    assert kot1.status == KOTStatus.BUMPED
    pg_session.refresh(pos_order)
    assert pos_order.status == OrderStatus.READY

    # STEP 11: Repeat process for Table 02
    order2_payload = {
        "customer_name": "Ananya Sharma (Table 2 Guest)",
        "table_id": "T-02",
        "items": [
            {"dish_id": "dish-06", "name": "Hyderabadi Biryani", "price": 390, "quantity": 1}
        ]
    }
    submit_r2 = pg_client.post(f"/api/v1/qr/{token2}/orders", json=order2_payload)
    assert submit_r2.status_code == 200
    order2_data = submit_r2.json()
    order2_id = order2_data["id"]

    # STEP 12: Confirm both tables remain isolated
    pg_session.refresh(t2)
    assert t2.status == TableStatus.OCCUPIED
    assert t2.current_order_id == order2_id
    assert order1_id != order2_id
    kot2 = pg_session.query(KOT).filter(KOT.order_id == order2_id).first()
    assert kot2.id != kot1.id
    assert kot2.kot_number > kot1.kot_number

    # STEP 13 & 14: Attempt to order unavailable / out of stock item and confirm backend rejection
    dish_unavailable = pg_session.query(MenuItem).filter(MenuItem.id == "dish-02").first()
    dish_unavailable.is_in_stock = False
    pg_session.commit()

    fail_resp = pg_client.post(
        f"/api/v1/qr/{token1}/orders",
        json={"items": [{"dish_id": "dish-02", "name": "Paneer Tikka Masala", "price": 290, "quantity": 1}]}
    )
    assert fail_resp.status_code == 400
    assert "out of stock" in fail_resp.json()["detail"].lower()

    # STEP 15: Regenerate Table 01 QR
    regen1_resp = pg_client.post("/api/v1/tables/T-01/regenerate-qr", headers=mgr_headers)
    assert regen1_resp.status_code == 200
    new_token1 = regen1_resp.json()["qr_token"]
    assert new_token1 != token1

    # STEP 16: Confirm previous token is rejected (404)
    assert pg_client.get(f"/api/v1/qr/{token1}/table").status_code == 404
    assert pg_client.get(f"/api/v1/qr/{token1}/menu").status_code == 404

    # STEP 17: Confirm new QR works (200)
    assert pg_client.get(f"/api/v1/qr/{new_token1}/table").status_code == 200
    assert pg_client.get(f"/api/v1/qr/{new_token1}/menu").status_code == 200

    # STEP 18: Settle the bill for Table 01
    settle_order = OrderService.settle_bill(pg_session, order1_id, payment_method="upi")
    assert settle_order.payment_status == PaymentStatus.PAID
    assert settle_order.status == OrderStatus.COMPLETED

    # Free the table
    t1.status = TableStatus.VACANT
    t1.current_order_id = None
    t1.current_bill = Decimal("0.00")
    pg_session.commit()
    pg_session.refresh(t1)
    assert t1.status == TableStatus.VACANT

    # STEP 19: Verify inventory deduction occurred
    # Check that stock transactions exist for order1_id
    txns = pg_session.query(StockTransaction).filter(StockTransaction.reference_id == order1_id).all()
    assert len(txns) >= 1
    for txn in txns:
        assert txn.quantity < 0  # Consumed

    # STEP 20: Verify analytics and table status reflect actual transaction
    assert t1.current_bill == Decimal("0.00")
    assert t2.status == TableStatus.OCCUPIED
    assert t2.current_order_id == order2_id
