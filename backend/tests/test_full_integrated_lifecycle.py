import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database.session import get_db
from app.models.restaurant import Restaurant
from app.models.table import DiningTable, TableStatus
from app.models.menu import MenuItem
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus, PlacedBy
from app.models.kot import KOT, KOTItem, KOTStatus
from app.models.payment import Payment, PaymentMethod
from app.models.inventory import Ingredient, StockTransaction
from app.models.audit_log import AIConversation

# Run against isolated PostgreSQL test database chotu_test
TEST_DATABASE_URL = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/chotu_test"
test_engine = create_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="module")
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_full_e2e_restaurant_lifecycle_workflow(client):
    """
    CRITICAL ACCEPTANCE CRITERION TEST:
    Demonstrates the complete operational lifecycle end-to-end:
    QR Scan → Menu → Cart → Order Submission → PostgreSQL → POS → KOT → KDS → Kitchen Completion → Bill Settlement → Inventory Update → Analytics.
    """
    db = TestingSessionLocal()
    try:
        # Pre-condition: Check Table T-03 exists and get initial inventory
        table_t3 = db.query(DiningTable).filter(DiningTable.label == "T-03").first()
        assert table_t3 is not None, "Table T-03 must exist"
        qr_token = table_t3.qr_token
        
        butter_before = db.query(Ingredient).filter(Ingredient.name.ilike("%Butter%")).first()
        butter_stock_before = float(butter_before.current_stock) if butter_before else 0.0

        analytics_before = client.get("/api/v1/analytics/overview").json()
        rev_before = float(analytics_before.get("today_revenue", 0.0))

        # -------------------------------------------------------------
        # STEP 1: QR Scan & Menu Fetch
        # -------------------------------------------------------------
        qr_menu_resp = client.get(f"/api/v1/qr/{qr_token}/menu")
        assert qr_menu_resp.status_code == 200, qr_menu_resp.text
        qr_menu_data = qr_menu_resp.json()
        assert qr_menu_data["table_label"] == "T-03"
        assert len(qr_menu_data["items"]) >= 5
        dish_01 = next(d for d in qr_menu_data["items"] if d["id"] == "dish-01")  # Butter Chicken
        dish_04 = next(d for d in qr_menu_data["items"] if d["id"] == "dish-04")  # Garlic Naan

        # -------------------------------------------------------------
        # STEP 2: Cart & Order Submission via QR
        # -------------------------------------------------------------
        order_payload = {
            "customer_name": "Priya Sharma (Guest QR)",
            "captain_notes": "Table 03 customer self-order",
            "items": [
                {
                    "dish_id": dish_01["id"],
                    "name": dish_01["name"],
                    "price": float(dish_01["price"]),
                    "quantity": 1,
                    "dietary": dish_01["dietary"],
                    "station": dish_01["station"]
                },
                {
                    "dish_id": dish_04["id"],
                    "name": dish_04["name"],
                    "price": float(dish_04["price"]),
                    "quantity": 2,
                    "dietary": dish_04["dietary"],
                    "station": dish_04["station"]
                }
            ]
        }
        submit_resp = client.post(f"/api/v1/qr/{qr_token}/orders", json=order_payload)
        assert submit_resp.status_code == 200, submit_resp.text
        order_data = submit_resp.json()
        order_id = order_data["id"]
        assert order_data["placed_by"] == "qr"
        assert float(order_data["total_amount"]) > 0

        # -------------------------------------------------------------
        # STEP 3: PostgreSQL Verification
        # -------------------------------------------------------------
        db.expire_all()
        persisted_order = db.query(Order).filter(Order.id == order_id).first()
        assert persisted_order is not None
        assert persisted_order.customer_name == "Priya Sharma (Guest QR)"
        assert len(persisted_order.items) >= 2
        
        table_t3_fresh = db.query(DiningTable).filter(DiningTable.id == table_t3.id).first()
        assert table_t3_fresh.status == TableStatus.OCCUPIED
        assert table_t3_fresh.current_order_id == order_id

        # -------------------------------------------------------------
        # STEP 4: POS Inspection & Independence
        # -------------------------------------------------------------
        pos_resp = client.get(f"/api/v1/pos/tables/{table_t3.id}/order")
        assert pos_resp.status_code == 200
        pos_order = pos_resp.json()
        assert pos_order["id"] == order_id
        t3_dish_names = [i["name"] for i in pos_order["items"]]
        assert any("Butter Chicken" in n for n in t3_dish_names)

        # Verify Table T-02 is independent and does not have T-03's items
        pos_t2_resp = client.get("/api/v1/pos/tables/T-02/order")
        assert pos_t2_resp.status_code == 200
        pos_t2_order = pos_t2_resp.json()
        assert pos_t2_order["id"] != order_id

        # -------------------------------------------------------------
        # STEP 5 & 6: KOT & KDS Ticket Stream
        # -------------------------------------------------------------
        kds_resp = client.get("/api/v1/kds/tickets?status=active")
        assert kds_resp.status_code == 200
        active_tickets = kds_resp.json()
        matching_kot = next((k for k in active_tickets if k["table_id"] == "T-03"), None)
        assert matching_kot is not None, "KOT must be visible in KDS active tickets"
        kot_id = matching_kot["id"]

        # -------------------------------------------------------------
        # STEP 7: Kitchen Completion (Prep Toggle & Bump)
        # -------------------------------------------------------------
        kot_item_id = matching_kot["items"][0]["id"]
        toggle_resp = client.patch(f"/api/v1/kds/items/{kot_item_id}/toggle-prepared")
        assert toggle_resp.status_code == 200
        assert toggle_resp.json()["is_prepared"] is True

        bump_resp = client.post(f"/api/v1/kds/tickets/{kot_id}/bump")
        assert bump_resp.status_code == 200
        assert bump_resp.json()["status"] == "bumped"

        # -------------------------------------------------------------
        # STEP 8: Bill Settlement (UPI Payment)
        # -------------------------------------------------------------
        settle_resp = client.post(
            f"/api/v1/pos/tables/{table_t3.id}/settle",
            json={"payment_method": "upi"}
        )
        assert settle_resp.status_code == 200
        settled_order = settle_resp.json()
        assert settled_order["payment_status"] == "paid"
        assert settled_order["status"] == "completed"

        # Verify Table T-03 is now vacant
        db.expire_all()
        table_t3_settled = db.query(DiningTable).filter(DiningTable.id == table_t3.id).first()
        assert table_t3_settled.status == TableStatus.VACANT
        assert table_t3_settled.current_order_id is None
        assert float(table_t3_settled.current_bill) == 0.0

        # Verify Payment Record in PostgreSQL
        payment_record = db.query(Payment).filter(Payment.order_id == order_id).first()
        assert payment_record is not None
        assert payment_record.method == PaymentMethod.UPI
        assert float(payment_record.amount) > 0

        # -------------------------------------------------------------
        # STEP 9: Inventory Deduction Verification
        # -------------------------------------------------------------
        db.expire_all()
        butter_after = db.query(Ingredient).filter(Ingredient.name.ilike("%Butter%")).first()
        if butter_after:
            assert float(butter_after.current_stock) <= butter_stock_before
        
        stock_txns = db.query(StockTransaction).filter(StockTransaction.reference_id == order_id).all()
        assert len(stock_txns) >= 1, "Stock deductions must be logged in stock_transactions"

        # -------------------------------------------------------------
        # STEP 10: Operational Analytics & Chotu AI Reflection
        # -------------------------------------------------------------
        analytics_after = client.get("/api/v1/analytics/overview").json()
        rev_after = float(analytics_after.get("today_revenue", 0.0))
        assert rev_after > rev_before, "Today revenue must reflect the settled order"

        ai_resp = client.post(
            "/api/v1/ai/chat",
            json={"message": "What are today's sales?"}
        )
        assert ai_resp.status_code == 200
        ai_data = ai_resp.json()
        assert "sales" in ai_data["reply"].lower() or "total" in ai_data["reply"].lower()
        assert ai_data["intent"] == "QUERY_SALES"

    finally:
        db.close()
