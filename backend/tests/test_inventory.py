def test_inventory_management(client):
    # 1. Fetch ingredients
    resp = client.get("/api/v1/inventory/ingredients")
    assert resp.status_code == 200
    ingredients = resp.json()
    assert len(ingredients) >= 7

    chicken = next(i for i in ingredients if "Chicken" in i["name"])
    initial_stock = float(chicken["current_stock"])

    # 2. Adjust stock (Receive shipment)
    adj_resp = client.post(
        f"/api/v1/inventory/ingredients/{chicken['id']}/adjust",
        json={"quantity": 5.0, "transaction_type": "purchase", "notes": "New poultry delivery"}
    )
    assert adj_resp.status_code == 200
    assert float(adj_resp.json()["current_stock"]) == initial_stock + 5.0

    # 3. Check low-stock alerts
    alerts_resp = client.get("/api/v1/inventory/alerts")
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    assert any("Butter" in a["name"] or "Cream" in a["name"] for a in alerts)
