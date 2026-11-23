def test_analytics_overview(client):
    resp = client.get("/api/v1/analytics/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "today_revenue" in data
    assert "channel_sales" in data
    assert len(data["channel_sales"]) == 3
    assert "weekly_traffic" in data
    assert len(data["weekly_traffic"]) == 7
    assert "top_dishes" in data
    assert "low_stock_alerts" in data
