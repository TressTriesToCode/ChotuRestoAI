def test_table_independence(client):
    """
    CRITICAL REQUIREMENT TEST:
    Verify that table T-01 and table T-02 have completely independent order ledgers.
    """
    # 1. Fetch T-01 order and add Butter Chicken
    resp_t1 = client.get("/api/v1/pos/tables/T-01/order")
    assert resp_t1.status_code == 200
    order_t1 = resp_t1.json()

    # Add Butter Chicken (dish-01) to T-01
    client.post(
        "/api/v1/pos/tables/T-01/order/items",
        json={"dish_id": "dish-01", "delta_qty": 1}
    )
    
    # 2. Fetch T-02 order (initially vacant / empty)
    resp_t2 = client.get("/api/v1/pos/tables/T-02/order")
    assert resp_t2.status_code == 200
    order_t2 = resp_t2.json()

    # Add Dal Makhani (dish-03) to T-02
    client.post(
        "/api/v1/pos/tables/T-02/order/items",
        json={"dish_id": "dish-03", "delta_qty": 2}
    )

    # 3. Re-verify T-01 has Butter Chicken and NOT Dal Makhani
    check_t1 = client.get("/api/v1/pos/tables/T-01/order").json()
    t1_dishes = [i["name"] for i in check_t1["items"]]
    assert any("Butter Chicken" in d for d in t1_dishes)
    assert not any("Dal Makhani" in d for d in t1_dishes)

    # 4. Re-verify T-02 has Dal Makhani and NOT Butter Chicken
    check_t2 = client.get("/api/v1/pos/tables/T-02/order").json()
    t2_dishes = [i["name"] for i in check_t2["items"]]
    assert any("Dal Makhani" in d for d in t2_dishes)
    assert not any("Butter Chicken" in d for d in t2_dishes)

def test_pos_fire_kot_and_settlement(client):
    # Add Garlic Naan to T-02
    client.post(
        "/api/v1/pos/tables/T-02/order/items",
        json={"dish_id": "dish-04", "delta_qty": 2}
    )

    # Fire KOT
    kot_resp = client.post(
        "/api/v1/pos/tables/T-02/fire-kot",
        json={"captain_notes": "Well roasted"}
    )
    assert kot_resp.status_code == 200
    kot = kot_resp.json()
    assert kot["table_id"] == "T-02"
    assert kot["kot_number"] > 1000

    # Settle payment
    settle_resp = client.post(
        "/api/v1/pos/tables/T-02/settle",
        json={"payment_method": "upi"}
    )
    assert settle_resp.status_code == 200
    settled_order = settle_resp.json()
    assert settled_order["payment_status"] == "paid"
    assert settled_order["status"] == "completed"

    # Verify table is now vacant
    table_resp = client.get("/api/v1/tables/T-02")
    assert table_resp.status_code == 200
    assert table_resp.json()["status"] == "vacant"
    assert float(table_resp.json()["current_bill"]) == 0.0
