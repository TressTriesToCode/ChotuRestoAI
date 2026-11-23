import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.models.table import DiningTable, TableStatus
from app.models.order import Order, OrderMode, OrderStatus, PaymentStatus, PlacedBy

def test_table_transfer_endpoint(client: TestClient, db_session):
    # Ensure source table T-01 is occupied with an order
    t1 = db_session.query(DiningTable).filter(DiningTable.id == "T-01").first()
    t2 = db_session.query(DiningTable).filter(DiningTable.id == "T-02").first()
    assert t1 is not None and t2 is not None

    # Set up active order on T-01
    order = Order(
        id="ord-transfer-test",
        restaurant_id="rest-spice-jct",
        table_id="T-01",
        order_number="T-01-TRANSFER",
        token_number="IND-TRANS-01",
        customer_name="Transfer Guest",
        mode=OrderMode.DINE_IN,
        status=OrderStatus.PREPARING,
        payment_status=PaymentStatus.PENDING,
        placed_by=PlacedBy.POS,
        subtotal=Decimal("450.00"),
        cgst=Decimal("11.25"),
        sgst=Decimal("11.25"),
        service_charge=Decimal("22.50"),
        discount=Decimal("0.00"),
        total_amount=Decimal("495.00")
    )
    db_session.add(order)
    db_session.flush()

    t1.status = TableStatus.OCCUPIED
    t1.current_order_id = order.id
    t1.current_bill = Decimal("495.00")
    t1.captain_name = "Captain Rahul"
    t1.opened_at = "20:00"

    t2.status = TableStatus.VACANT
    t2.current_order_id = None
    t2.current_bill = Decimal("0.00")
    db_session.commit()

    # Call transfer endpoint from T-01 to T-02
    res = client.post(
        "/api/v1/tables/T-01/transfer",
        json={"target_table_id": "T-02"}
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["id"] == "T-02"
    assert data["status"] == "occupied"
    assert float(data["current_bill"]) == 495.0

    # Verify in DB
    db_session.refresh(t1)
    db_session.refresh(t2)
    assert t1.status == TableStatus.VACANT
    assert t1.current_order_id is None
    assert float(t1.current_bill) == 0.0

    assert t2.status == TableStatus.OCCUPIED
    assert t2.current_order_id == "ord-transfer-test"
    assert float(t2.current_bill) == 495.0
