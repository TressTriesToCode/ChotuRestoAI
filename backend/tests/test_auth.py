def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "manager@spicejunction.in", "password": "Chotu@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "manager"
    assert data["restaurant_id"] == "rest-spice-jct"

def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "manager@spicejunction.in", "password": "WrongPassword"}
    )
    assert response.status_code == 401

def test_get_me(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "manager@spicejunction.in", "password": "Chotu@123"}
    )
    token = login_resp.json()["access_token"]
    
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "manager@spicejunction.in"
