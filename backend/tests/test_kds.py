def test_kds_bump_and_recall(client):
    # 1. Fetch active tickets
    kds_resp = client.get("/api/v1/kds/tickets?status=active")
    assert kds_resp.status_code == 200
    active_tickets = kds_resp.json()
    assert len(active_tickets) > 0
    target_kot = active_tickets[0]

    # 2. Toggle an item prepared
    item_id = target_kot["items"][0]["id"]
    toggle_resp = client.patch(f"/api/v1/kds/items/{item_id}/toggle-prepared")
    assert toggle_resp.status_code == 200
    assert "is_prepared" in toggle_resp.json()

    # 3. Bump ticket (mark cooked & bump)
    bump_resp = client.post(f"/api/v1/kds/tickets/{target_kot['id']}/bump")
    assert bump_resp.status_code == 200
    assert bump_resp.json()["status"] == "bumped"

    # 4. Verify it moved to completed queue
    completed_resp = client.get("/api/v1/kds/tickets?status=completed")
    assert completed_resp.status_code == 200
    assert any(k["id"] == target_kot["id"] for k in completed_resp.json())

    # 5. Recall ticket back to active queue
    recall_resp = client.post(f"/api/v1/kds/tickets/{target_kot['id']}/recall")
    assert recall_resp.status_code == 200
    assert recall_resp.json()["status"] == "cooking"
