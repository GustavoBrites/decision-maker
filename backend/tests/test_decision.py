def test_recommendation_empty(client):
    response = client.get("/decision/recommendation?availableMinutes=60&energyLevel=medium")
    assert response.status_code == 200
    data = response.json()
    # Should create a free time task
    assert data["task"]["title"] == "Relax and Recharge"

def test_recommendation_match(client):
    client.post("/tasks", json={"title": "Work hard", "estimatedMinutes": 50, "energy": "high"})
    client.post("/tasks", json={"title": "Chill", "estimatedMinutes": 30, "energy": "low"})
    
    response = client.get("/decision/recommendation?availableMinutes=60&energyLevel=high")
    assert response.status_code == 200
    data = response.json()
    assert data["task"]["title"] == "Work hard"
    
    response_low = client.get("/decision/recommendation?availableMinutes=60&energyLevel=low")
    assert response_low.status_code == 200
    assert response_low.json()["task"]["title"] == "Chill"
