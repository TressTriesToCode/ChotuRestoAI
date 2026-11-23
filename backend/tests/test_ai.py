def test_chotu_ai_sales_query(client):
    resp = client.post(
        "/api/v1/ai/chat",
        json={"message": "What are today's sales?"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "today's total" in data["reply"].lower() or "sales" in data["reply"].lower()
    assert data["intent"] == "QUERY_SALES"

def test_chotu_ai_table_query(client):
    resp = client.post(
        "/api/v1/ai/chat",
        json={"message": "How many tables are occupied?"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "occupied" in data["reply"].lower() or "vacant" in data["reply"].lower()
    assert data["intent"] == "QUERY_TABLES"

def test_chotu_ai_inventory_query(client):
    resp = client.post(
        "/api/v1/ai/chat",
        json={"message": "Which ingredients are running low on stock?"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "QUERY_INVENTORY"
    assert "butter" in data["reply"].lower() or "cream" in data["reply"].lower()
