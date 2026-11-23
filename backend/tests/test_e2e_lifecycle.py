from decimal import Decimal
from app.models.inventory import Ingredient
from app.models.table import DiningTable, TableStatus
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.kot import KOT, KOTStatus

def test_complete_cross_module_restaurant_lifecycle(client, db_session):
    # Step 1: Guest visits vacant Table T-02 and views QR menu
    resp = client.get("/api/v1/qr/qr-t02-demo/menu")
    assert resp.status_code == 200
    menu_data = resp.json()
    assert menu_data["restaurant_name"] == "The Spice Junction"
    assert menu_data["table_label"] == "T-02"

    # Capture initial stock of Chicken
    chicken = db_session.query(Ingredient).filter(Ingredient.name.ilike("%chicken%")).first()
    initial_chicken_stock = chicken.current_stock if chicken else Decimal("0")

    # Step 2: Guest places QR order for Table T-02 (Butter Chicken + Garlic Naan)
    order_payload = {
        "customer_name": "Aditya Verma (Guest QR)",
        "captain_notes": "Table 2 self-order from smartphone",
        "items": [
            {
                "dish_id": "dish-01",
                "name": "Butter Chicken (Boneless)",
                "price": 340.0,
                "quantity": 1,
                "dietary": "nonveg",
                "station": "curry",
                "notes": "Medium spice"
            },
            {
                "dish_id": "dish-04",
                "name": "Garlic Butter Naan",
                "price": 60.0,
                "quantity": 2,
                "dietary": "veg",
                "station": "tandoor",
                "notes": "Extra crisp"
            }
        ]
    }
    resp = client.post("/api/v1/qr/qr-t02-demo/orders", json=order_payload)
    assert resp.status_code == 200
    order_result = resp.json()
    order_id = order_result["id"]
    assert order_result["placed_by"] == "qr"
    assert order_result["table_id"] == "T-02"
    assert order_result["status"] in ("confirmed", "preparing")

    # Step 3: Check Table T-02 is marked OCCUPIED in database
    table = db_session.query(DiningTable).filter(DiningTable.id == "T-02").first()
    assert table.status == TableStatus.OCCUPIED
    assert table.current_bill > 0

    # Step 4: Check KDS automatically received KOT ticket
    resp = client.get("/api/v1/kds/tickets?status=active")
    assert resp.status_code == 200
    tickets = resp.json()
    t2_tickets = [t for t in tickets if t["table_id"] == "T-02"]
    assert len(t2_tickets) > 0
    active_kot = t2_tickets[0]
    assert active_kot["status"] == "cooking"

    # Step 5: Check Inventory Deduction occurred for recipe ingredients
    if chicken:
        db_session.refresh(chicken)
        assert chicken.current_stock < initial_chicken_stock

    # Step 6: Cashier checks POS terminal for Table T-02
    resp = client.get("/api/v1/pos/tables/T-02/order")
    assert resp.status_code == 200
    pos_order = resp.json()
    assert pos_order["id"] == order_id
    assert len(pos_order["items"]) == 2

    # Step 7: Chef finishes cooking and bumps KOT in KDS
    resp = client.post(f"/api/v1/kds/tickets/{active_kot['id']}/bump")
    assert resp.status_code == 200
    bumped = resp.json()
    assert bumped["status"] == "bumped"

    # Step 8: Cashier settles bill via UPI on POS terminal
    resp = client.post(
        "/api/v1/pos/tables/T-02/settle",
        json={"payment_method": "upi", "discount_amount": 0.0}
    )
    assert resp.status_code == 200
    settled_order = resp.json()
    assert settled_order["payment_status"] == "paid"
    assert settled_order["status"] == "completed"

    # Verify Table T-02 is now vacant with 0 balance
    table_resp = client.get("/api/v1/tables/T-02")
    assert table_resp.status_code == 200
    assert table_resp.json()["status"] == "vacant"
    assert float(table_resp.json()["current_bill"]) == 0.0

    # Step 9: Verify Analytics overview captures the settled revenue
    resp = client.get("/api/v1/analytics/overview")
    assert resp.status_code == 200
    analytics = resp.json()
    assert float(analytics["today_revenue"]) > 0
    assert analytics["total_tables"] >= 5
