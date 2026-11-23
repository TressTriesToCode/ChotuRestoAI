def test_qr_menu_and_order_flow(client):
    """
    CRITICAL WORKFLOW TEST:
    1. Scan QR token for Table T-04 -> fetches menu
    2. Place order via QR -> creates real order, automatically fires KOT to kitchen
    3. Verify KOT is visible in KDS
    """
    # 1. Fetch menu via table QR token
    menu_resp = client.get("/api/v1/qr/qr-t04-demo/menu")
    assert menu_resp.status_code == 200
    data = menu_resp.json()
    assert data["table_label"] == "T-04"
    assert len(data["items"]) >= 10

    # 2. Submit QR order
    order_resp = client.post(
        "/api/v1/qr/qr-t04-demo/orders",
        json={
            "customer_name": "Arjun Kapoor (Guest QR)",
            "captain_notes": "Table 4 self-order from smartphone",
            "items": [
                {
                    "dish_id": "dish-01",
                    "name": "Butter Chicken (Boneless)",
                    "price": 340.0,
                    "quantity": 1,
                    "dietary": "nonveg",
                    "station": "curry"
                },
                {
                    "dish_id": "dish-04",
                    "name": "Garlic Butter Naan",
                    "price": 60.0,
                    "quantity": 2,
                    "dietary": "veg",
                    "station": "tandoor"
                }
            ]
        }
    )
    assert order_resp.status_code == 200
    created_order = order_resp.json()
    assert created_order["table_id"] == "T-04"
    assert created_order["placed_by"] == "qr"
    assert float(created_order["total_amount"]) > 0

    # 3. Verify KOT appears in KDS queue
    kds_resp = client.get("/api/v1/kds/tickets?status=active")
    assert kds_resp.status_code == 200
    tickets = kds_resp.json()
    assert any(t["table_id"] == "T-04" for t in tickets)
