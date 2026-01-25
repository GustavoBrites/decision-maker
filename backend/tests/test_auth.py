def test_signup(client):
    response = client.post("/api/auth/signup", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "password"
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "new@example.com"

def test_login(client):
    client.post("/api/auth/signup", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "password"
    })
    response = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "password"
    })
    assert response.status_code == 200
    assert "token" in response.json()

def test_login_invalid(client):
    response = client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "password"
    })
    assert response.status_code == 400

def test_me(client, auth_header):
    response = client.get("/api/auth/me", headers=auth_header)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
