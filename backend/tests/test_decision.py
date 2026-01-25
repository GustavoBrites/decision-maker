def test_recommendation_empty(client, auth_header):
    response = client.get("/api/decision/recommendation?availableMinutes=60&energyLevel=medium", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    # Should create a free time task
    assert data["task"]["title"] == "Relax and Recharge"

def test_recommendation_match(client, auth_header):
    client.post("/api/tasks", json={"title": "Work hard", "estimatedMinutes": 50, "energy": "high"}, headers=auth_header)
    client.post("/api/tasks", json={"title": "Chill", "estimatedMinutes": 30, "energy": "low"}, headers=auth_header)
    
    response = client.get("/api/decision/recommendation?availableMinutes=60&energyLevel=high", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert data["task"]["title"] == "Work hard"
    
    response_low = client.get("/api/decision/recommendation?availableMinutes=60&energyLevel=low", headers=auth_header)
    assert response_low.status_code == 200
    assert response_low.json()["task"]["title"] == "Chill"
